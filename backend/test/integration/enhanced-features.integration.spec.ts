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

describe('Enhanced Features Integration Tests', () => {
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

  describe('Multi-language Support Integration', () => {
    it('should process patient data in English', async () => {
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
      expect(result.message).toBe('Patient data successfully sent to Athena');
      expect(i18nService.translate).toHaveBeenCalledWith('success.dataSent', 'en', { ehrName: 'Athena' });
    });

    it('should process patient data in Spanish', async () => {
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
      i18nService.translate.mockReturnValue('Datos del paciente enviados exitosamente a Athena');

      const result = await service.sendPatientData('Athena', mockPatientData, 'es');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Datos del paciente enviados exitosamente a Athena');
      expect(i18nService.translate).toHaveBeenCalledWith('success.dataSent', 'es', { ehrName: 'Athena' });
    });

    it('should validate patient data with Spanish error messages', async () => {
      const invalidPatientData = { firstName: '', lastName: 'Doe', age: 30, gender: 'male', contact: { email: 'test@example.com', phone: '555-123-4567' } };
      i18nService.translate.mockReturnValue('El nombre es obligatorio');

      await expect(service.sendPatientData('Athena', invalidPatientData as any, 'es')).rejects.toThrow('El nombre es obligatorio');
      expect(i18nService.translate).toHaveBeenCalledWith('validation.firstName', 'es');
    });
  });

  describe('Caching Integration', () => {
    it('should use cached mapping when available', async () => {
      const mockMapping = { patient: { firstName: 'PATIENT_FIRST_NAME' } };
      const mockTransactionLog = { id: 1, ehrName: 'Athena', patientData: mockPatientData };
      const mockResult = {
        success: true,
        transactionId: 'ATHENA-123',
        data: { mapped: 'data' },
        timestamp: '2025-01-01T00:00:00Z',
      };

      // Cache hit
      cacheService.getEhrMapping.mockResolvedValue(mockMapping);
      transactionLogRepository.create.mockReturnValue(mockTransactionLog as any);
      transactionLogRepository.save.mockResolvedValue(mockTransactionLog as any);
      athenaStrategy.mapData.mockReturnValue({ mapped: 'data' });
      athenaStrategy.sendData.mockResolvedValue(mockResult);
      transactionLogRepository.update.mockResolvedValue(undefined);
      i18nService.translate.mockReturnValue('Patient data successfully sent to Athena');

      const result = await service.sendPatientData('Athena', mockPatientData, 'en');

      expect(result.success).toBe(true);
      expect(cacheService.getEhrMapping).toHaveBeenCalledWith('Athena');
      // Should not call database
      expect(ehrMappingRepository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when cache miss', async () => {
      const mockMapping = { patient: { firstName: 'PATIENT_FIRST_NAME' } };
      const mockEhrMapping = { ehrName: 'Athena', mappingConfig: mockMapping };
      const mockTransactionLog = { id: 1, ehrName: 'Athena', patientData: mockPatientData };
      const mockResult = {
        success: true,
        transactionId: 'ATHENA-123',
        data: { mapped: 'data' },
        timestamp: '2025-01-01T00:00:00Z',
      };

      // Cache miss
      cacheService.getEhrMapping.mockResolvedValue(null);
      ehrMappingRepository.findOne.mockResolvedValue(mockEhrMapping as any);
      cacheService.setEhrMapping.mockResolvedValue(undefined);
      transactionLogRepository.create.mockReturnValue(mockTransactionLog as any);
      transactionLogRepository.save.mockResolvedValue(mockTransactionLog as any);
      athenaStrategy.mapData.mockReturnValue({ mapped: 'data' });
      athenaStrategy.sendData.mockResolvedValue(mockResult);
      transactionLogRepository.update.mockResolvedValue(undefined);
      i18nService.translate.mockReturnValue('Patient data successfully sent to Athena');

      const result = await service.sendPatientData('Athena', mockPatientData, 'en');

      expect(result.success).toBe(true);
      expect(cacheService.getEhrMapping).toHaveBeenCalledWith('Athena');
      expect(ehrMappingRepository.findOne).toHaveBeenCalledWith({ where: { ehrName: 'Athena' } });
      expect(cacheService.setEhrMapping).toHaveBeenCalledWith('Athena', mockMapping, 3600);
    });

    it('should invalidate cache when mapping is updated', async () => {
      const mappingConfig = { patient: { firstName: 'PATIENT_FIRST_NAME' } };
      const mockEhrMapping = { ehrName: 'Athena', mappingConfig };

      ehrMappingRepository.findOne.mockResolvedValue(null);
      ehrMappingRepository.create.mockReturnValue(mockEhrMapping as any);
      ehrMappingRepository.save.mockResolvedValue(mockEhrMapping as any);
      cacheService.invalidateEhrMapping.mockResolvedValue(undefined);

      await service.saveEhrMapping('Athena', mappingConfig);

      expect(cacheService.invalidateEhrMapping).toHaveBeenCalledWith('Athena');
    });
  });

  describe('Message Queue Integration', () => {
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

    it('should process bulk patient data asynchronously', async () => {
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

    it('should provide queue monitoring capabilities', async () => {
      const mockQueueStatus = { waiting: 5, active: 2, completed: 10, failed: 1 };
      const mockJobStatus = { id: 'job-123', state: 'active', progress: 50 };

      queueService.getQueueStatus.mockResolvedValue(mockQueueStatus);
      queueService.getJobStatus.mockResolvedValue(mockJobStatus);

      const queueStatus = await service.getQueueStatus();
      const jobStatus = await service.getJobStatus('job-123');

      expect(queueStatus).toEqual(mockQueueStatus);
      expect(jobStatus).toEqual(mockJobStatus);
      expect(queueService.getQueueStatus).toHaveBeenCalled();
      expect(queueService.getJobStatus).toHaveBeenCalledWith('job-123');
    });
  });

  describe('Combined Features Integration', () => {
    it('should process patient data with all enhanced features', async () => {
      const mockMapping = { patient: { firstName: 'PATIENT_FIRST_NAME' } };
      const mockTransactionLog = { id: 1, ehrName: 'Athena', patientData: mockPatientData };
      const mockResult = {
        success: true,
        transactionId: 'ATHENA-123',
        data: { mapped: 'data' },
        timestamp: '2025-01-01T00:00:00Z',
      };

      // Cache hit
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
      expect(result.message).toBe('Patient data successfully sent to Athena');
      
      // Verify caching was used
      expect(cacheService.getEhrMapping).toHaveBeenCalledWith('Athena');
      
      // Verify mapping was applied
      expect(athenaStrategy.mapData).toHaveBeenCalledWith(mockPatientData, mockMapping);
      
      // Verify EHR data was sent
      expect(athenaStrategy.sendData).toHaveBeenCalledWith({ mapped: 'data' });
      
      // Verify transaction was logged
      expect(transactionLogRepository.create).toHaveBeenCalled();
      expect(transactionLogRepository.update).toHaveBeenCalledWith(1, {
        status: 'success',
        transactionId: 'ATHENA-123',
        ehrResponse: JSON.stringify(mockResult),
      });
      
      // Verify i18n was used
      expect(i18nService.translate).toHaveBeenCalledWith('success.dataSent', 'en', { ehrName: 'Athena' });
    });

    it('should handle errors with multi-language support and caching', async () => {
      const mockMapping = { patient: { firstName: 'PATIENT_FIRST_NAME' } };
      const mockTransactionLog = { id: 1, ehrName: 'Athena', patientData: mockPatientData };

      cacheService.getEhrMapping.mockResolvedValue(mockMapping);
      transactionLogRepository.create.mockReturnValue(mockTransactionLog as any);
      transactionLogRepository.save.mockResolvedValue(mockTransactionLog as any);
      athenaStrategy.mapData.mockReturnValue({ mapped: 'data' });
      athenaStrategy.sendData.mockRejectedValue(new Error('EHR API error'));
      transactionLogRepository.update.mockResolvedValue(undefined);
      i18nService.translate.mockReturnValue('Transaction failed');

      await expect(service.sendPatientData('Athena', mockPatientData, 'es')).rejects.toThrow();

      // Verify error was logged
      expect(transactionLogRepository.update).toHaveBeenCalledWith(1, {
        status: 'failed',
        errorMessage: 'EHR API error',
      });
      
      // Verify Spanish error message
      expect(i18nService.translate).toHaveBeenCalledWith('errors.transactionFailed', 'es');
    });
  });
});
