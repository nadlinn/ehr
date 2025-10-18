import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EhrMapping } from './ehr-mapping.entity';
import { TransactionLog } from './entities/transaction-log.entity';
import { IEhrIntegration } from './IEhrIntegration';
import { AthenaStrategy } from './athena/athena.strategy';
import { AllscriptsStrategy } from './allscripts/allscripts.strategy';
import { PatientDataDto, SendPatientDataDto, MultiEndpointEhrMappingDto, EhrEndpointDto } from './dto/patient-data.dto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { I18nService } from '../i18n/i18n.service';
import { CacheService } from '../cache/cache.service';
import { PostgresQueueService } from '../queue/postgres-queue.service';

export interface EndpointSubmissionResult {
  endpointName: string;
  success: boolean;
  transactionId?: string;
  error?: string;
  data?: any;
}

export interface MultiEndpointSubmissionResult {
  ehrName: string;
  overallSuccess: boolean;
  endpointResults: EndpointSubmissionResult[];
  totalEndpoints: number;
  successfulEndpoints: number;
  failedEndpoints: number;
}

@Injectable()
export class MultiEndpointEhrService {
  private readonly logger = new Logger(MultiEndpointEhrService.name);
  private readonly strategies: Map<string, IEhrIntegration>;

  constructor(
    private readonly athenaStrategy: AthenaStrategy,
    private readonly allscriptsStrategy: AllscriptsStrategy,
    @InjectRepository(EhrMapping)
    private ehrMappingRepository: Repository<EhrMapping>,
    @InjectRepository(TransactionLog)
    private transactionLogRepository: Repository<TransactionLog>,
    private readonly i18nService: I18nService,
    private readonly cacheService: CacheService,
    private readonly queueService: PostgresQueueService,
  ) {
    this.strategies = new Map();
    this.strategies.set(this.athenaStrategy.getEHRName(), this.athenaStrategy);
    this.strategies.set(this.allscriptsStrategy.getEHRName(), this.allscriptsStrategy);
  }

  /**
   * Validates patient data using DTO and class-validator.
   */
  private async validatePatientData(patientData: any, language: string): Promise<void> {
    const patientDataDto = plainToClass(PatientDataDto, patientData);
    const errors = await validate(patientDataDto);
    if (errors.length > 0) {
      const errorMessages = errors.map(error => {
        for (const key in error.constraints) {
          return this.i18nService.translate(`errors.${key}`, language, error.constraints);
        }
      }).filter(Boolean);
      throw new BadRequestException(errorMessages.join(', '));
    }
  }

  /**
   * Retrieves EHR mapping configuration with multi-endpoint support.
   */
  async getEhrMapping(ehrName: string): Promise<EhrMapping | null> {
    let mapping = await this.cacheService.getEhrMapping(ehrName);
    if (mapping) {
      this.logger.debug(`EHR mapping for ${ehrName} found in cache.`);
      return mapping;
    }

    mapping = await this.ehrMappingRepository.findOne({ where: { ehrName } });
    if (mapping) {
      await this.cacheService.setEhrMapping(ehrName, mapping);
    }
    return mapping;
  }

  /**
   * Determines which endpoints should receive data based on patient data fields.
   */
  private determineTargetEndpoints(patientData: PatientDataDto, mappingConfig: any): string[] {
    const targetEndpoints: string[] = [];
    const endpoints = mappingConfig.endpoints || [];

    for (const endpoint of endpoints) {
      const hasRelevantData = endpoint.supportedFields.some((field: string) => {
        // Check if the field exists and has a value in patient data
        const fieldValue = this.getNestedFieldValue(patientData, field);
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      });

      if (hasRelevantData) {
        targetEndpoints.push(endpoint.endpointName);
      }
    }

    return targetEndpoints;
  }

  /**
   * Gets nested field value from patient data (e.g., contact.email).
   */
  private getNestedFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Maps patient data for a specific endpoint.
   */
  private mapDataForEndpoint(patientData: PatientDataDto, endpointName: string, mappingConfig: any): any {
    const endpointMapping = mappingConfig.fieldMappings[endpointName];
    if (!endpointMapping) {
      throw new Error(`No mapping found for endpoint: ${endpointName}`);
    }

    const mappedData: any = {};
    
    for (const [field, ehrField] of Object.entries(endpointMapping)) {
      const value = this.getNestedFieldValue(patientData, field);
      if (value !== undefined && value !== null && value !== '') {
        mappedData[ehrField as string] = value;
      }
    }

    return mappedData;
  }

  /**
   * Sends data to a specific endpoint.
   */
  private async sendToEndpoint(
    ehrName: string,
    endpointName: string,
    mappedData: any,
    patientData: PatientDataDto
  ): Promise<EndpointSubmissionResult> {
    try {
      this.logger.log(`Sending data to ${ehrName} endpoint: ${endpointName}`);
      
      // Get the EHR strategy
      const strategy = this.strategies.get(ehrName);
      if (!strategy) {
        throw new Error(`No strategy found for EHR: ${ehrName}`);
      }

      // Create endpoint-specific data structure
      const endpointData = {
        endpointName,
        patientData: mappedData,
        originalData: patientData
      };

      // Send to EHR system
      const result = await strategy.sendData(endpointData);
      
      return {
        endpointName,
        success: true,
        transactionId: result.transactionId,
        data: result
      };
    } catch (error) {
      this.logger.error(`Failed to send data to ${ehrName} endpoint ${endpointName}: ${error.message}`);
      return {
        endpointName,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sends patient data to multiple endpoints of an EHR system.
   */
  async sendPatientDataToMultipleEndpoints(sendPatientDataDto: SendPatientDataDto): Promise<MultiEndpointSubmissionResult> {
    const { ehrName, patientData, language = 'en', targetEndpoints } = sendPatientDataDto;

    await this.validatePatientData(patientData, language);

    // Get EHR mapping configuration
    const mappingConfig = await this.getEhrMapping(ehrName);
    if (!mappingConfig) {
      throw new NotFoundException(this.i18nService.translate('errors.mappingNotFound', language, { ehrName }));
    }

    // Determine target endpoints
    const endpointsToUse = targetEndpoints || this.determineTargetEndpoints(patientData, mappingConfig.mappingConfig);
    
    if (endpointsToUse.length === 0) {
      throw new BadRequestException('No relevant endpoints found for the provided patient data');
    }

    this.logger.log(`Sending patient data to ${endpointsToUse.length} endpoints: ${endpointsToUse.join(', ')}`);

    // Create transaction log
    const transactionLog = this.transactionLogRepository.create({
      ehrName,
      patientData,
      status: 'pending',
    });
    await this.transactionLogRepository.save(transactionLog);

    const endpointResults: EndpointSubmissionResult[] = [];
    let successfulEndpoints = 0;
    let failedEndpoints = 0;

    // Process each endpoint
    for (const endpointName of endpointsToUse) {
      try {
        // Map data for this endpoint
        const mappedData = this.mapDataForEndpoint(patientData, endpointName, mappingConfig.mappingConfig);
        
        // Send to endpoint
        const result = await this.sendToEndpoint(ehrName, endpointName, mappedData, patientData);
        endpointResults.push(result);

        if (result.success) {
          successfulEndpoints++;
        } else {
          failedEndpoints++;
        }
      } catch (error) {
        this.logger.error(`Error processing endpoint ${endpointName}: ${error.message}`);
        endpointResults.push({
          endpointName,
          success: false,
          error: error.message
        });
        failedEndpoints++;
      }
    }

    // Update transaction log
    const overallSuccess = failedEndpoints === 0;
    transactionLog.status = overallSuccess ? 'success' : 'failed';
    transactionLog.mappedData = { endpointResults };
    if (!overallSuccess) {
      transactionLog.errorMessage = `${failedEndpoints} endpoints failed`;
    }
    await this.transactionLogRepository.save(transactionLog);

    return {
      ehrName,
      overallSuccess,
      endpointResults,
      totalEndpoints: endpointsToUse.length,
      successfulEndpoints,
      failedEndpoints
    };
  }

  /**
   * Sends patient data asynchronously to multiple endpoints.
   */
  async sendPatientDataToMultipleEndpointsAsync(sendPatientDataDto: SendPatientDataDto): Promise<any> {
    const { ehrName, patientData, language = 'en' } = sendPatientDataDto;

    await this.validatePatientData(patientData, language);

    // Create transaction log
    const transactionLog = this.transactionLogRepository.create({
      ehrName,
      patientData,
      status: 'queued',
    });
    await this.transactionLogRepository.save(transactionLog);

    try {
      // Add to queue for processing
      const job = await this.queueService.addEhrJob({
        ehrName,
        patientData,
        language,
        transactionId: transactionLog.id.toString(),
        multiEndpoint: true
      });

      await this.cacheService.setTransactionStatus(`txn-${transactionLog.id}`, 'queued');

      return {
        success: true,
        message: this.i18nService.translate('success.patientDataSentAsync', language, { ehrName, transactionId: transactionLog.id }),
        jobId: job.id,
        transactionId: transactionLog.id,
        multiEndpoint: true
      };
    } catch (error) {
      this.logger.error(`Error queuing multi-endpoint patient data for ${ehrName}: ${error.message}`);
      transactionLog.status = 'failed';
      transactionLog.errorMessage = `Failed to queue: ${error.message}`;
      await this.transactionLogRepository.save(transactionLog);
      throw new BadRequestException(this.i18nService.translate('errors.queueError', language));
    }
  }

  /**
   * Gets available endpoints for an EHR system.
   */
  async getEhrEndpoints(ehrName: string): Promise<EhrEndpointDto[]> {
    const mappingConfig = await this.getEhrMapping(ehrName);
    if (!mappingConfig) {
      throw new NotFoundException(`No mapping configuration found for EHR: ${ehrName}`);
    }

    return mappingConfig.mappingConfig.endpoints || [];
  }

  /**
   * Gets field mappings for a specific endpoint.
   */
  async getEndpointFieldMappings(ehrName: string, endpointName: string): Promise<Record<string, string>> {
    const mappingConfig = await this.getEhrMapping(ehrName);
    if (!mappingConfig) {
      throw new NotFoundException(`No mapping configuration found for EHR: ${ehrName}`);
    }

    const endpointMappings = mappingConfig.mappingConfig.fieldMappings[endpointName];
    if (!endpointMappings) {
      throw new NotFoundException(`No field mappings found for endpoint: ${endpointName}`);
    }

    return endpointMappings;
  }

  /**
   * Gets queue status.
   */
  async getQueueStatus(): Promise<any> {
    return this.queueService.getQueueStatus();
  }
}
