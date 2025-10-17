import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnhancedEhrIntegrationService } from '../../src/ehr-integrations/enhanced-ehr-integration.service';
import { AthenaStrategy } from '../../src/ehr-integrations/athena/athena.strategy';
import { AllscriptsStrategy } from '../../src/ehr-integrations/allscripts/allscripts.strategy';
import { EhrMapping } from '../../src/ehr-integrations/ehr-mapping.entity';
import { TransactionLog } from '../../src/ehr-integrations/entities/transaction-log.entity';
import { QueueService } from '../../src/queue/queue.service';
import { CacheService } from '../../src/cache/cache.service';
import { I18nService } from '../../src/i18n/i18n.service';
import { PatientDataDto } from '../../src/ehr-integrations/dto/patient-data.dto';

describe('EnhancedEhrIntegrationService', () => {
  let service: EnhancedEhrIntegrationService;
  let ehrMappingRepository: jest.Mocked<Repository<EhrMapping>>;
  let transactionLogRepository: jest.Mocked<Repository<TransactionLog>>;
  let athenaStrategy: jest.Mocked<AthenaStrategy>;
  let allscriptsStrategy: jest.Mocked<AllscriptsStrategy>;
  let queueService: jest.Mocked<QueueService>;
  let cacheService: jest.Mocked<CacheService>;
  let i18nService: jest.Mocked<I18nService>;

  const mockPatientData: PatientDataDto = {
    firstName: 'John',
    lastName: 'Doe',
    age: 30,
    gender: 'male',
    contact: {
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      address: '123 Main St',
    },
  };

  beforeEach(async () => {
    const mockEhrMappingRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockTransactionLogRepository = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockAthenaStrategy = {
      getEHRName: jest.fn().mockReturnValue('Athena'),
      sendData: jest.fn(),
      mapData: jest.fn(),
    };

    const mockAllscriptsStrategy = {
      getEHRName: jest.fn().mockReturnValue('Allscripts'),
      sendData: jest.fn(),
      mapData: jest.fn(),
    };

    const mockQueueService = {
      addEhrJob: jest.fn(),
      addBulkEhrJobs: jest.fn(),
      getQueueStatus: jest.fn(),
      getJobStatus: jest.fn(),
      retryFailedJob: jest.fn(),
    };

    const mockCacheService = {
      getEhrMapping: jest.fn(),
      setEhrMapping: jest.fn(),
      invalidateEhrMapping: jest.fn(),
      reset: jest.fn(),
    };

    const mockI18nService = {
      translate: jest.fn(),
      getSupportedLanguages: jest.fn().mockReturnValue(['en', 'es']),
      isLanguageSupported: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnhancedEhrIntegrationService,
        {
          provide: getRepositoryToken(EhrMapping),
          useValue: mockEhrMappingRepository,
        },
        {
          provide: getRepositoryToken(TransactionLog),
          useValue: mockTransactionLogRepository,
        },
        {
          provide: AthenaStrategy,
          useValue: mockAthenaStrategy,
        },
        {
          provide: AllscriptsStrategy,
          useValue: mockAllscriptsStrategy,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<EnhancedEhrIntegrationService>(EnhancedEhrIntegrationService);
    ehrMappingRepository = module.get(getRepositoryToken(EhrMapping));
    transactionLogRepository = module.get(getRepositoryToken(TransactionLog));
    athenaStrategy = module.get(AthenaStrategy);
    allscriptsStrategy = module.get(AllscriptsStrategy);
    queueService = module.get(QueueService);
    cacheService = module.get(CacheService);
    i18nService = module.get(I18nService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPatientData (synchronous)', () => {
    it('should send patient data successfully', async () => {
      const mockMapping = { patient: { firstName: 'PATIENT_FIRST_NAME' } };
      const mockTransactionLog = { id: 1, ehrName: 'Athena', patientData: mockPatientData };
      const mockResult = {
        success: true,
        transactionId: 'ATHENA-123',
        data: { mapped: 'data' },
        timestamp: '2025-01-01T00:00:00Z',
      };

      cacheService.getEhrMapping.mockResolvedValue(mockMapping);
      transactionLogRepository.create.mockReturnValue(mockTransactionLog as any);
      transactionLogRepository.save.mockResolvedValue(mockTransactionLog as any);
      athenaStrategy.mapData.mockReturnValue({ mapped: 'data' });
      athenaStrategy.sendData.mockResolvedValue(mockResult);
      transactionLogRepository.update.mockResolvedValue(undefined);
      i18nService.translate.mockReturnValue('Patient data successfully sent to Athena');

      const result = await service.sendPatientData('Athena', mockPatientData, 'en');

      expect(result.success).toBe(true);
      expect(result.ehr).toBe('Athena');
      expect(result.transactionId).toBe('ATHENA-123');
      expect(cacheService.getEhrMapping).toHaveBeenCalledWith('Athena');
      expect(athenaStrategy.mapData).toHaveBeenCalledWith(mockPatientData, mockMapping);
      expect(athenaStrategy.sendData).toHaveBeenCalledWith({ mapped: 'data' });
    });

    it('should handle errors and update transaction log', async () => {
      const mockMapping = { patient: { firstName: 'PATIENT_FIRST_NAME' } };
      const mockTransactionLog = { id: 1, ehrName: 'Athena', patientData: mockPatientData };

      cacheService.getEhrMapping.mockResolvedValue(mockMapping);
      transactionLogRepository.create.mockReturnValue(mockTransactionLog as any);
      transactionLogRepository.save.mockResolvedValue(mockTransactionLog as any);
      athenaStrategy.mapData.mockReturnValue({ mapped: 'data' });
      athenaStrategy.sendData.mockRejectedValue(new Error('EHR API error'));
      transactionLogRepository.update.mockResolvedValue(undefined);
      i18nService.translate.mockReturnValue('Transaction failed');

      await expect(service.sendPatientData('Athena', mockPatientData, 'en')).rejects.toThrow();

      expect(transactionLogRepository.update).toHaveBeenCalledWith(1, {
        status: 'failed',
        errorMessage: 'EHR API error',
      });
    });

    it('should validate patient data with i18n', async () => {
      const invalidPatientData = { firstName: '', lastName: 'Doe', age: 30, gender: 'male', contact: { email: 'test@example.com', phone: '555-123-4567' } };
      i18nService.translate.mockReturnValue('First name is required');

      await expect(service.sendPatientData('Athena', invalidPatientData as any, 'en')).rejects.toThrow('First name is required');
    });
  });

  describe('sendPatientDataAsync (asynchronous)', () => {
    it('should queue patient data for asynchronous processing', async () => {
      const mockMapping = { patient: { firstName: 'PATIENT_FIRST_NAME' } };
      const mockTransactionLog = { id: 1, ehrName: 'Athena', patientData: mockPatientData };

      cacheService.getEhrMapping.mockResolvedValue(mockMapping);
      transactionLogRepository.create.mockReturnValue(mockTransactionLog as any);
      transactionLogRepository.save.mockResolvedValue(mockTransactionLog as any);
      athenaStrategy.mapData.mockReturnValue({ mapped: 'data' });
      transactionLogRepository.update.mockResolvedValue(undefined);
      queueService.addEhrJob.mockResolvedValue(undefined);
      i18nService.translate.mockReturnValue('Patient data successfully sent to Athena');

      const result = await service.sendPatientDataAsync('Athena', mockPatientData, 'en');

      expect(result.success).toBe(true);
      expect(result.status).toBe('queued');
      expect(result.transactionId).toBe('TXN-1');
      expect(queueService.addEhrJob).toHaveBeenCalledWith({
        ehrName: 'Athena',
        patientData: { mapped: 'data' },
        transactionId: 'TXN-1',
        language: 'en',
      });
    });
  });

  describe('sendBulkPatientData', () => {
    it('should queue multiple patient data jobs', async () => {
      const jobs = [
        { ehrName: 'Athena', patientData: mockPatientData, language: 'en' },
        { ehrName: 'Allscripts', patientData: mockPatientData, language: 'es' },
      ];

      const mockMapping = { patient: { firstName: 'PATIENT_FIRST_NAME' } };
      const mockTransactionLog = { id: 1, ehrName: 'Athena', patientData: mockPatientData };

      cacheService.getEhrMapping.mockResolvedValue(mockMapping);
      transactionLogRepository.create.mockReturnValue(mockTransactionLog as any);
      transactionLogRepository.save.mockResolvedValue(mockTransactionLog as any);
      athenaStrategy.mapData.mockReturnValue({ mapped: 'data' });
      allscriptsStrategy.mapData.mockReturnValue({ mapped: 'data' });
      transactionLogRepository.update.mockResolvedValue(undefined);
      queueService.addBulkEhrJobs.mockResolvedValue(undefined);

      const result = await service.sendBulkPatientData(jobs);

      expect(result.success).toBe(true);
      expect(result.queuedJobs).toBe(2);
      expect(queueService.addBulkEhrJobs).toHaveBeenCalled();
    });
  });

  describe('getEhrMappingWithCache', () => {
    it('should return cached mapping if available', async () => {
      const mockMapping = { patient: { firstName: 'PATIENT_FIRST_NAME' } };
      cacheService.getEhrMapping.mockResolvedValue(mockMapping);

      const result = await service.getEhrMappingWithCache('Athena');

      expect(result).toEqual(mockMapping);
      expect(cacheService.getEhrMapping).toHaveBeenCalledWith('Athena');
    });

    it('should fetch from database and cache if not in cache', async () => {
      const mockMapping = { patient: { firstName: 'PATIENT_FIRST_NAME' } };
      const mockEhrMapping = { ehrName: 'Athena', mappingConfig: mockMapping };

      cacheService.getEhrMapping.mockResolvedValue(null);
      ehrMappingRepository.findOne.mockResolvedValue(mockEhrMapping as any);
      cacheService.setEhrMapping.mockResolvedValue(undefined);

      const result = await service.getEhrMappingWithCache('Athena');

      expect(result).toEqual(mockMapping);
      expect(ehrMappingRepository.findOne).toHaveBeenCalledWith({ where: { ehrName: 'Athena' } });
      expect(cacheService.setEhrMapping).toHaveBeenCalledWith('Athena', mockMapping, 3600);
    });

    it('should throw error if mapping not found in database', async () => {
      cacheService.getEhrMapping.mockResolvedValue(null);
      ehrMappingRepository.findOne.mockResolvedValue(null);
      i18nService.translate.mockReturnValue('Mapping configuration not found for EHR: Athena');

      await expect(service.getEhrMappingWithCache('Athena')).rejects.toThrow('Mapping configuration not found for EHR: Athena');
    });
  });

  describe('queue monitoring', () => {
    it('should get queue status', async () => {
      const mockStatus = { waiting: 5, active: 2, completed: 10, failed: 1 };
      queueService.getQueueStatus.mockResolvedValue(mockStatus);

      const result = await service.getQueueStatus();

      expect(result).toEqual(mockStatus);
      expect(queueService.getQueueStatus).toHaveBeenCalled();
    });

    it('should get job status', async () => {
      const mockJobStatus = { id: 'job-123', state: 'active', progress: 50 };
      queueService.getJobStatus.mockResolvedValue(mockJobStatus);

      const result = await service.getJobStatus('job-123');

      expect(result).toEqual(mockJobStatus);
      expect(queueService.getJobStatus).toHaveBeenCalledWith('job-123');
    });

    it('should retry failed job', async () => {
      queueService.retryFailedJob.mockResolvedValue(undefined);

      await service.retryFailedJob('job-123');

      expect(queueService.retryFailedJob).toHaveBeenCalledWith('job-123');
    });
  });

  describe('cache management', () => {
    it('should invalidate EHR mapping cache', async () => {
      cacheService.invalidateEhrMapping.mockResolvedValue(undefined);

      await service.invalidateEhrMappingCache('Athena');

      expect(cacheService.invalidateEhrMapping).toHaveBeenCalledWith('Athena');
    });

    it('should clear all caches', async () => {
      cacheService.reset.mockResolvedValue(undefined);

      await service.clearAllCaches();

      expect(cacheService.reset).toHaveBeenCalled();
    });
  });

  describe('saveEhrMapping', () => {
    it('should save new EHR mapping and invalidate cache', async () => {
      const mappingConfig = { patient: { firstName: 'PATIENT_FIRST_NAME' } };
      const mockEhrMapping = { ehrName: 'Athena', mappingConfig };

      ehrMappingRepository.findOne.mockResolvedValue(null);
      ehrMappingRepository.create.mockReturnValue(mockEhrMapping as any);
      ehrMappingRepository.save.mockResolvedValue(mockEhrMapping as any);
      cacheService.invalidateEhrMapping.mockResolvedValue(undefined);

      const result = await service.saveEhrMapping('Athena', mappingConfig);

      expect(result).toEqual(mockEhrMapping);
      expect(ehrMappingRepository.create).toHaveBeenCalledWith({
        ehrName: 'Athena',
        mappingConfig,
      });
      expect(cacheService.invalidateEhrMapping).toHaveBeenCalledWith('Athena');
    });

    it('should update existing EHR mapping and invalidate cache', async () => {
      const mappingConfig = { patient: { firstName: 'PATIENT_FIRST_NAME' } };
      const existingMapping = { ehrName: 'Athena', mappingConfig: { old: 'config' } };
      const updatedMapping = { ...existingMapping, mappingConfig };

      ehrMappingRepository.findOne.mockResolvedValue(existingMapping as any);
      ehrMappingRepository.save.mockResolvedValue(updatedMapping as any);
      cacheService.invalidateEhrMapping.mockResolvedValue(undefined);

      const result = await service.saveEhrMapping('Athena', mappingConfig);

      expect(result).toEqual(updatedMapping);
      expect(existingMapping.mappingConfig).toEqual(mappingConfig);
      expect(cacheService.invalidateEhrMapping).toHaveBeenCalledWith('Athena');
    });
  });

  describe('getTransactionLogs', () => {
    it('should get transaction logs without filters', async () => {
      const mockLogs = [{ id: 1, ehrName: 'Athena' }, { id: 2, ehrName: 'Allscripts' }];
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLogs),
      };

      transactionLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getTransactionLogs();

      expect(result).toEqual(mockLogs);
      expect(transactionLogRepository.createQueryBuilder).toHaveBeenCalledWith('log');
    });

    it('should get transaction logs with EHR name filter', async () => {
      const mockLogs = [{ id: 1, ehrName: 'Athena' }];
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLogs),
      };

      transactionLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getTransactionLogs('Athena');

      expect(result).toEqual(mockLogs);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('log.ehrName = :ehrName', { ehrName: 'Athena' });
    });

    it('should get transaction logs with status filter', async () => {
      const mockLogs = [{ id: 1, status: 'success' }];
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLogs),
      };

      transactionLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getTransactionLogs(undefined, 'success');

      expect(result).toEqual(mockLogs);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('log.status = :status', { status: 'success' });
    });
  });

  describe('retryFailedTransaction', () => {
    it('should retry failed transaction', async () => {
      const mockTransaction = { id: 1, status: 'failed', retryCount: 0 };

      transactionLogRepository.findOne.mockResolvedValue(mockTransaction as any);
      transactionLogRepository.update.mockResolvedValue(undefined);

      await service.retryFailedTransaction(1);

      expect(transactionLogRepository.update).toHaveBeenCalledWith(1, {
        status: 'pending',
        retryCount: 1,
        errorMessage: null,
      });
    });

    it('should throw error if transaction not found', async () => {
      transactionLogRepository.findOne.mockResolvedValue(null);

      await expect(service.retryFailedTransaction(999)).rejects.toThrow('Transaction not found');
    });

    it('should throw error if transaction is not failed', async () => {
      const mockTransaction = { id: 1, status: 'success', retryCount: 0 };

      transactionLogRepository.findOne.mockResolvedValue(mockTransaction as any);

      await expect(service.retryFailedTransaction(1)).rejects.toThrow('Only failed transactions can be retried');
    });
  });
});
