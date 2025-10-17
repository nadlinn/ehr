import { Injectable, InternalServerErrorException, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EhrMapping } from './ehr-mapping.entity';
import { TransactionLog } from './entities/transaction-log.entity';
import { IEhrIntegration } from './IEhrIntegration';
import { AthenaStrategy } from './athena/athena.strategy';
import { AllscriptsStrategy } from './allscripts/allscripts.strategy';
import { PatientDataDto } from './dto/patient-data.dto';

@Injectable()
export class EhrIntegrationService {
  private readonly logger = new Logger(EhrIntegrationService.name);
  private readonly strategies: Map<string, IEhrIntegration>;

  constructor(
    private readonly athenaStrategy: AthenaStrategy,
    private readonly allscriptsStrategy: AllscriptsStrategy,
    @InjectRepository(EhrMapping)
    private ehrMappingRepository: Repository<EhrMapping>,
    @InjectRepository(TransactionLog)
    private transactionLogRepository: Repository<TransactionLog>,
  ) {
    this.strategies = new Map<string, IEhrIntegration>();
    this.strategies.set(athenaStrategy.getEHRName(), athenaStrategy);
    this.strategies.set(allscriptsStrategy.getEHRName(), allscriptsStrategy);
    
    // Debug logging
    this.logger.log(`Registered strategies: ${Array.from(this.strategies.keys()).join(', ')}`);
    this.logger.log(`Athena strategy EHR name: ${athenaStrategy.getEHRName()}`);
    this.logger.log(`Allscripts strategy EHR name: ${allscriptsStrategy.getEHRName()}`);
  }

  getStrategy(ehrName: string): IEhrIntegration {
    const strategy = this.strategies.get(ehrName);
    if (!strategy) {
      throw new InternalServerErrorException(`EHR integration strategy not found for ${ehrName}`);
    }
    return strategy;
  }

  async sendPatientData(ehrName: string, patientData: PatientDataDto): Promise<any> {
    this.logger.log(`Processing patient data for EHR: ${ehrName}`);
    
    // Validate patient data
    this.validatePatientData(patientData);

    // Get EHR mapping configuration
    const ehrMapping = await this.ehrMappingRepository.findOne({ where: { ehrName } });
    if (!ehrMapping) {
      throw new NotFoundException(`Mapping configuration not found for EHR: ${ehrName}`);
    }

    // Create transaction log
    const transactionLog = this.transactionLogRepository.create({
      ehrName,
      patientData,
      status: 'pending',
      retryCount: 0
    });
    await this.transactionLogRepository.save(transactionLog);

    try {
      const strategy = this.getStrategy(ehrName);
      const mappingConfig = ehrMapping.mappingConfig;
      
      // Map patient data according to EHR-specific configuration
      const mappedData = strategy.mapData(patientData, mappingConfig);
      
      // Update transaction log with mapped data
      transactionLog.mappedData = mappedData;
      await this.transactionLogRepository.save(transactionLog);

      // Send data to EHR system
      const result = await strategy.sendData(mappedData);
      
      // Update transaction log with success
      transactionLog.status = 'success';
      transactionLog.ehrResponse = JSON.stringify(result);
      transactionLog.transactionId = result.transactionId;
      await this.transactionLogRepository.save(transactionLog);

      this.logger.log(`Successfully sent patient data to ${ehrName}`);
      return result;

    } catch (error) {
      this.logger.error(`Failed to send patient data to ${ehrName}: ${error.message}`);
      
      // Update transaction log with failure
      transactionLog.status = 'failed';
      transactionLog.errorMessage = error.message;
      await this.transactionLogRepository.save(transactionLog);

      throw error;
    }
  }

  async saveEhrMapping(ehrName: string, mappingConfig: any): Promise<EhrMapping> {
    this.logger.log(`Saving mapping configuration for EHR: ${ehrName}`);
    
    // Validate mapping configuration
    this.validateMappingConfig(mappingConfig);

    let ehrMapping = await this.ehrMappingRepository.findOne({ where: { ehrName } });
    if (ehrMapping) {
      ehrMapping.mappingConfig = mappingConfig;
    } else {
      ehrMapping = this.ehrMappingRepository.create({ ehrName, mappingConfig });
    }
    
    const savedMapping = await this.ehrMappingRepository.save(ehrMapping);
    this.logger.log(`Mapping configuration saved for EHR: ${ehrName}`);
    return savedMapping;
  }

  async getEhrMapping(ehrName: string): Promise<EhrMapping> {
    const ehrMapping = await this.ehrMappingRepository.findOne({ where: { ehrName } });
    if (!ehrMapping) {
      throw new NotFoundException(`Mapping configuration not found for EHR: ${ehrName}`);
    }
    return ehrMapping;
  }

  async getTransactionLogs(ehrName?: string, status?: string): Promise<TransactionLog[]> {
    const where: any = {};
    if (ehrName) where.ehrName = ehrName;
    if (status) where.status = status;

    return this.transactionLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100
    });
  }

  async retryFailedTransaction(transactionId: number): Promise<any> {
    const transaction = await this.transactionLogRepository.findOne({ where: { id: transactionId } });
    if (!transaction) {
      throw new NotFoundException(`Transaction not found: ${transactionId}`);
    }

    if (transaction.status !== 'failed') {
      throw new BadRequestException(`Transaction is not in failed state: ${transaction.status}`);
    }

    // Update retry count
    transaction.retryCount += 1;
    transaction.status = 'retrying';
    await this.transactionLogRepository.save(transaction);

    try {
      const result = await this.sendPatientData(transaction.ehrName, transaction.patientData);
      this.logger.log(`Successfully retried transaction ${transactionId}`);
      return result;
    } catch (error) {
      transaction.status = 'failed';
      transaction.errorMessage = error.message;
      await this.transactionLogRepository.save(transaction);
      throw error;
    }
  }

  private validatePatientData(patientData: PatientDataDto): void {
    if (!patientData.firstName || !patientData.lastName) {
      throw new BadRequestException('Patient first name and last name are required');
    }

    if (!patientData.contact || !patientData.contact.email || !patientData.contact.phone) {
      throw new BadRequestException('Patient contact information (email and phone) are required');
    }

    if (patientData.age < 0 || patientData.age > 150) {
      throw new BadRequestException('Invalid patient age');
    }
  }

  private validateMappingConfig(mappingConfig: any): void {
    if (!mappingConfig || typeof mappingConfig !== 'object') {
      throw new BadRequestException('Mapping configuration must be a valid object');
    }

    if (Object.keys(mappingConfig).length === 0) {
      throw new BadRequestException('Mapping configuration cannot be empty');
    }
  }
}
