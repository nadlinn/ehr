import { Injectable, InternalServerErrorException, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EhrMapping } from './ehr-mapping.entity';
import { TransactionLog } from './entities/transaction-log.entity';
import { IEhrIntegration } from './IEhrIntegration';
import { AthenaStrategy } from './athena/athena.strategy';
import { AllscriptsStrategy } from './allscripts/allscripts.strategy';
import { PatientDataDto } from './dto/patient-data.dto';
import { QueueService } from '../queue/queue.service';
import { CacheService } from '../cache/cache.service';
import { I18nService } from '../i18n/i18n.service';

@Injectable()
export class EnhancedEhrIntegrationService {
  private readonly logger = new Logger(EnhancedEhrIntegrationService.name);
  private readonly strategies: Map<string, IEhrIntegration>;

  constructor(
    private readonly athenaStrategy: AthenaStrategy,
    private readonly allscriptsStrategy: AllscriptsStrategy,
    @InjectRepository(EhrMapping)
    private ehrMappingRepository: Repository<EhrMapping>,
    @InjectRepository(TransactionLog)
    private transactionLogRepository: Repository<TransactionLog>,
    private readonly queueService: QueueService,
    private readonly cacheService: CacheService,
    private readonly i18nService: I18nService,
  ) {
    this.strategies = new Map();
    this.strategies.set(this.athenaStrategy.getEHRName(), this.athenaStrategy);
    this.strategies.set(this.allscriptsStrategy.getEHRName(), this.allscriptsStrategy);

    this.logger.log(`Registered strategies: ${Array.from(this.strategies.keys()).join(', ')}`);
    this.logger.log(`Athena strategy EHR name: ${this.athenaStrategy.getEHRName()}`);
    this.logger.log(`Allscripts strategy EHR name: ${this.allscriptsStrategy.getEHRName()}`);
  }

  // Synchronous processing (original method)
  async sendPatientData(ehrName: string, patientData: PatientDataDto, language: string = 'en'): Promise<any> {
    this.logger.log(`Processing patient data for EHR: ${ehrName}`);
    
    // Validate patient data with i18n support
    this.validatePatientData(patientData, language);
    
    // Get EHR strategy
    const strategy = this.getStrategy(ehrName);
    
    // Get mapping configuration (with caching)
    const mappingConfig = await this.getEhrMappingWithCache(ehrName);
    
    // Create transaction log
    const transactionLog = await this.createTransactionLog(ehrName, patientData);
    
    try {
      // Apply mapping
      const mappedData = strategy.mapData(patientData, mappingConfig);
      
      // Update transaction log with mapped data
      await this.updateTransactionLog(transactionLog.id, { mappedData, status: 'mapped' });
      
      // Send data to EHR
      const result = await strategy.sendData(mappedData);
      
      // Update transaction log with success
      await this.updateTransactionLog(transactionLog.id, {
        status: 'success',
        transactionId: result.transactionId,
        ehrResponse: JSON.stringify(result),
      });
      
      return {
        success: true,
        ehr: ehrName,
        transactionId: result.transactionId,
        data: result.data,
        timestamp: result.timestamp,
        message: this.i18nService.translate('success.dataSent', language, { ehrName }),
      };
    } catch (error) {
      this.logger.error(`Failed to send patient data to ${ehrName}: ${error.message}`);
      
      // Update transaction log with error
      await this.updateTransactionLog(transactionLog.id, {
        status: 'failed',
        errorMessage: error.message,
      });
      
      throw new InternalServerErrorException(
        this.i18nService.translate('errors.transactionFailed', language)
      );
    }
  }

  // Asynchronous processing (new method)
  async sendPatientDataAsync(ehrName: string, patientData: PatientDataDto, language: string = 'en'): Promise<any> {
    this.logger.log(`Queueing patient data for EHR: ${ehrName}`);
    
    // Validate patient data with i18n support
    this.validatePatientData(patientData, language);
    
    // Get EHR strategy
    const strategy = this.getStrategy(ehrName);
    
    // Get mapping configuration (with caching)
    const mappingConfig = await this.getEhrMappingWithCache(ehrName);
    
    // Create transaction log
    const transactionLog = await this.createTransactionLog(ehrName, patientData);
    
    // Apply mapping
    const mappedData = strategy.mapData(patientData, mappingConfig);
    
    // Update transaction log with mapped data
    await this.updateTransactionLog(transactionLog.id, { mappedData, status: 'queued' });
    
    // Queue the job for asynchronous processing
    await this.queueService.addEhrJob({
      ehrName,
      patientData: mappedData,
      transactionId: `TXN-${transactionLog.id}`,
      language,
    });
    
    return {
      success: true,
      message: this.i18nService.translate('success.dataSent', language, { ehrName }),
      transactionId: `TXN-${transactionLog.id}`,
      status: 'queued',
      estimatedProcessingTime: '2-5 minutes',
    };
  }

  // Bulk processing
  async sendBulkPatientData(jobs: Array<{ ehrName: string; patientData: PatientDataDto; language?: string }>): Promise<any> {
    this.logger.log(`Queueing bulk patient data: ${jobs.length} jobs`);
    
    const queueJobs = [];
    
    for (const job of jobs) {
      // Validate patient data
      this.validatePatientData(job.patientData, job.language || 'en');
      
      // Get EHR strategy
      const strategy = this.getStrategy(job.ehrName);
      
      // Get mapping configuration (with caching)
      const mappingConfig = await this.getEhrMappingWithCache(job.ehrName);
      
      // Create transaction log
      const transactionLog = await this.createTransactionLog(job.ehrName, job.patientData);
      
      // Apply mapping
      const mappedData = strategy.mapData(job.patientData, mappingConfig);
      
      // Update transaction log
      await this.updateTransactionLog(transactionLog.id, { mappedData, status: 'queued' });
      
      queueJobs.push({
        ehrName: job.ehrName,
        patientData: mappedData,
        transactionId: `TXN-${transactionLog.id}`,
        language: job.language || 'en',
      });
    }
    
    // Queue all jobs
    await this.queueService.addBulkEhrJobs(queueJobs);
    
    return {
      success: true,
      message: `Queued ${jobs.length} patient data transmissions`,
      queuedJobs: queueJobs.length,
      estimatedProcessingTime: `${Math.ceil(jobs.length * 0.5)}-${jobs.length * 2} minutes`,
    };
  }

  // Enhanced mapping with caching
  async getEhrMappingWithCache(ehrName: string): Promise<any> {
    // Try to get from cache first
    let mappingConfig = await this.cacheService.getEhrMapping(ehrName);
    
    if (!mappingConfig) {
      // Get from database
      const mapping = await this.ehrMappingRepository.findOne({ where: { ehrName } });
      if (!mapping) {
        throw new NotFoundException(
          this.i18nService.translate('errors.mappingNotFound', 'en', { ehrName })
        );
      }
      
      mappingConfig = mapping.mappingConfig;
      
      // Cache the mapping for 1 hour
      await this.cacheService.setEhrMapping(ehrName, mappingConfig, 3600);
    }
    
    return mappingConfig;
  }

  // Enhanced validation with i18n
  private validatePatientData(patientData: PatientDataDto, language: string): void {
    if (!patientData.firstName || !patientData.lastName) {
      throw new BadRequestException(
        this.i18nService.translate('validation.firstName', language) + ' ' +
        this.i18nService.translate('validation.lastName', language)
      );
    }

    if (!patientData.contact?.email || !patientData.contact?.phone) {
      throw new BadRequestException(
        this.i18nService.translate('validation.contact', language)
      );
    }

    if (patientData.age < 0 || patientData.age > 150) {
      throw new BadRequestException(
        this.i18nService.translate('validation.age', language)
      );
    }
  }

  // Queue status and monitoring
  async getQueueStatus(): Promise<any> {
    return this.queueService.getQueueStatus();
  }

  async getJobStatus(jobId: string): Promise<any> {
    return this.queueService.getJobStatus(jobId);
  }

  async retryFailedJob(jobId: string): Promise<void> {
    await this.queueService.retryFailedJob(jobId);
  }

  // Cache management
  async invalidateEhrMappingCache(ehrName: string): Promise<void> {
    await this.cacheService.invalidateEhrMapping(ehrName);
  }

  async clearAllCaches(): Promise<void> {
    await this.cacheService.reset();
  }

  // Original methods (enhanced with caching and i18n)
  private getStrategy(ehrName: string): IEhrIntegration {
    const strategy = this.strategies.get(ehrName);
    if (!strategy) {
      throw new NotFoundException(
        this.i18nService.translate('errors.ehrNotFound', 'en')
      );
    }
    return strategy;
  }

  private async createTransactionLog(ehrName: string, patientData: PatientDataDto): Promise<TransactionLog> {
    const transactionLog = this.transactionLogRepository.create({
      ehrName,
      patientData,
      status: 'pending',
      retryCount: 0,
    });
    
    return this.transactionLogRepository.save(transactionLog);
  }

  private async updateTransactionLog(id: number, updates: Partial<TransactionLog>): Promise<void> {
    await this.transactionLogRepository.update(id, updates);
  }

  // Keep original methods for backward compatibility
  async saveEhrMapping(ehrName: string, mappingConfig: any): Promise<EhrMapping> {
    // Invalidate cache when mapping is updated
    await this.cacheService.invalidateEhrMapping(ehrName);
    
    const existingMapping = await this.ehrMappingRepository.findOne({ where: { ehrName } });
    
    if (existingMapping) {
      existingMapping.mappingConfig = mappingConfig;
      return this.ehrMappingRepository.save(existingMapping);
    } else {
      const newMapping = this.ehrMappingRepository.create({
        ehrName,
        mappingConfig,
      });
      return this.ehrMappingRepository.save(newMapping);
    }
  }

  async getEhrMapping(ehrName: string): Promise<EhrMapping> {
    return this.getEhrMappingWithCache(ehrName);
  }

  async getTransactionLogs(ehrName?: string, status?: string): Promise<TransactionLog[]> {
    const query = this.transactionLogRepository.createQueryBuilder('log');
    
    if (ehrName) {
      query.andWhere('log.ehrName = :ehrName', { ehrName });
    }
    
    if (status) {
      query.andWhere('log.status = :status', { status });
    }
    
    return query.orderBy('log.createdAt', 'DESC').getMany();
  }

  async retryFailedTransaction(transactionId: number): Promise<void> {
    const transaction = await this.transactionLogRepository.findOne({ where: { id: transactionId } });
    
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    
    if (transaction.status !== 'failed') {
      throw new BadRequestException('Only failed transactions can be retried');
    }
    
    // Reset status and increment retry count
    await this.transactionLogRepository.update(transactionId, {
      status: 'pending',
      retryCount: transaction.retryCount + 1,
      errorMessage: undefined,
    });
  }
}
