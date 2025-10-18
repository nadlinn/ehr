import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MultiEndpointEhrService } from '../../src/ehr-integrations/multi-endpoint-ehr.service';
import { EhrMapping } from '../../src/ehr-integrations/ehr-mapping.entity';
import { TransactionLog } from '../../src/ehr-integrations/entities/transaction-log.entity';
import { AthenaStrategy } from '../../src/ehr-integrations/athena/athena.strategy';
import { AllscriptsStrategy } from '../../src/ehr-integrations/allscripts/allscripts.strategy';
import { I18nService } from '../../src/i18n/i18n.service';
import { CacheService } from '../../src/cache/cache.service';
import { QueueService } from '../../src/queue/queue.service';
import { SendPatientDataDto } from '../../src/ehr-integrations/dto/patient-data.dto';

describe('MultiEndpointEhrService', () => {
  let service: MultiEndpointEhrService;
  let mockEhrMappingRepository: jest.Mocked<Repository<EhrMapping>>;
  let mockTransactionLogRepository: jest.Mocked<Repository<TransactionLog>>;
  let mockAthenaStrategy: jest.Mocked<AthenaStrategy>;
  let mockAllscriptsStrategy: jest.Mocked<AllscriptsStrategy>;
  let mockI18nService: jest.Mocked<I18nService>;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockQueueService: jest.Mocked<QueueService>;

  const mockEhrMapping = {
    id: 1,
    ehrName: 'Athena',
    mappingConfig: {
      endpoints: [
        {
          endpointName: 'patient_demographics',
          endpointUrl: 'https://api.athenahealth.com/v1/patients',
          supportedFields: ['firstName', 'lastName', 'gender', 'age', 'contact'],
          description: 'Patient demographic information'
        },
        {
          endpointName: 'medical_history',
          endpointUrl: 'https://api.athenahealth.com/v1/patients/{patientId}/medical-history',
          supportedFields: ['medicalHistory', 'allergies', 'currentMedications', 'symptoms'],
          description: 'Medical history and current conditions'
        },
        {
          endpointName: 'social_history',
          endpointUrl: 'https://api.athenahealth.com/v1/patients/{patientId}/social-history',
          supportedFields: ['socialHistory', 'bloodType', 'maritalStatus'],
          description: 'Social and lifestyle factors'
        },
        {
          endpointName: 'family_history',
          endpointUrl: 'https://api.athenahealth.com/v1/patients/{patientId}/family-history',
          supportedFields: ['familyHistory'],
          description: 'Family medical history'
        }
      ],
      fieldMappings: {
        patient_demographics: {
          firstName: 'PATIENT_FIRST_NAME',
          lastName: 'PATIENT_LAST_NAME',
          gender: 'GENDER_OF_PATIENT',
          age: 'AGE_PATIENT',
          'contact.email': 'PATIENT_EMAIL_ID',
          'contact.phone': 'TELEPHONE_NUMBER_PATIENT'
        },
        medical_history: {
          medicalHistory: 'HISTORY_MEDICAL_PATIENT',
          allergies: 'ALLERGIES_PATIENT',
          currentMedications: 'PATIENT_MEDICATIONS_CURRENT',
          symptoms: 'CURRENT_SYMPTOMS_PATIENT'
        },
        social_history: {
          socialHistory: 'HISTORY_SOCIAL_PATIENT',
          bloodType: 'BLOOD_TYPE_PATIENT',
          maritalStatus: 'MARITAL_STATUS_PATIENT'
        },
        family_history: {
          familyHistory: 'HISTORY_FAMILY_PATIENT'
        }
      }
    }
  };

  const mockPatientData = {
    firstName: 'John',
    lastName: 'Doe',
    age: 30,
    gender: 'male',
    contact: {
      email: 'john@example.com',
      phone: '555-123-4567',
      address: '123 Main St'
    },
    medicalHistory: 'Previous abdominal surgery (2020), History of diabetes',
    socialHistory: 'Non-smoker, Occasional alcohol use, Office worker',
    familyHistory: 'Mother: diabetes, Father: heart disease',
    allergies: ['Penicillin', 'Shellfish'],
    medications: ['Metformin', 'Lisinopril'],
    symptoms: ['Chest pain', 'Shortness of breath'],
    bloodType: 'A+',
    maritalStatus: 'married',
    emergencyContact: 'Jane Doe (555-987-6543)',
    insuranceProvider: 'Blue Cross Blue Shield',
    insurancePolicyNumber: 'BC123456789',
    primaryCarePhysician: 'Dr. Smith, Internal Medicine'
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn()
      }))
    };

    const mockStrategy = {
      getEHRName: jest.fn(),
      sendData: jest.fn(),
      mapData: jest.fn()
    };

    const mockI18n = {
      translate: jest.fn((key: string) => key)
    };

    const mockCache = {
      getEhrMapping: jest.fn(),
      setEhrMapping: jest.fn(),
      invalidateEhrMapping: jest.fn(),
      setTransactionStatus: jest.fn()
    };

    const mockQueue = {
      addEhrJob: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiEndpointEhrService,
        {
          provide: getRepositoryToken(EhrMapping),
          useValue: mockRepository
        },
        {
          provide: getRepositoryToken(TransactionLog),
          useValue: mockRepository
        },
        {
          provide: AthenaStrategy,
          useValue: mockStrategy
        },
        {
          provide: AllscriptsStrategy,
          useValue: mockStrategy
        },
        {
          provide: I18nService,
          useValue: mockI18n
        },
        {
          provide: CacheService,
          useValue: mockCache
        },
        {
          provide: QueueService,
          useValue: mockQueue
        }
      ]
    }).compile();

    service = module.get<MultiEndpointEhrService>(MultiEndpointEhrService);
    mockEhrMappingRepository = module.get(getRepositoryToken(EhrMapping));
    mockTransactionLogRepository = module.get(getRepositoryToken(TransactionLog));
    mockAthenaStrategy = module.get(AthenaStrategy);
    mockAllscriptsStrategy = module.get(AllscriptsStrategy);
    mockI18nService = module.get(I18nService);
    mockCacheService = module.get(CacheService);
    mockQueueService = module.get(QueueService);

    // Setup default mocks
    mockAthenaStrategy.getEHRName.mockReturnValue('Athena');
    mockAllscriptsStrategy.getEHRName.mockReturnValue('Allscripts');
    mockAthenaStrategy.sendData.mockResolvedValue({
      success: true,
      transactionId: 'ATHENA-123',
      data: { patientId: 'ATH-123' }
    });
    mockAllscriptsStrategy.sendData.mockResolvedValue({
      success: true,
      transactionId: 'ALLSCRIPTS-123',
      data: { patientId: 'ALL-123' }
    });

    // Ensure the service strategies are properly initialized
    service['strategies'].set('Athena', mockAthenaStrategy);
    service['strategies'].set('Allscripts', mockAllscriptsStrategy);
  });

  describe('sendPatientDataToMultipleEndpoints', () => {
    it('should successfully send data to multiple endpoints', async () => {
      // Arrange
      const sendPatientDataDto: SendPatientDataDto = {
        ehrName: 'Athena',
        patientData: mockPatientData,
        language: 'en'
      };

      mockCacheService.getEhrMapping.mockResolvedValue(null);
      mockEhrMappingRepository.findOne.mockResolvedValue(mockEhrMapping);
      mockCacheService.setEhrMapping.mockResolvedValue();
      mockTransactionLogRepository.create.mockReturnValue({
        id: 1,
        ehrName: 'Athena',
        patientData: mockPatientData,
        status: 'pending'
      } as any);
      mockTransactionLogRepository.save.mockResolvedValue({
        id: 1,
        ehrName: 'Athena',
        patientData: mockPatientData,
        status: 'pending'
      } as any);

      // Act
      const result = await service.sendPatientDataToMultipleEndpoints(sendPatientDataDto);

      // Assert
      expect(result.ehrName).toBe('Athena');
      expect(result.overallSuccess).toBe(true);
      expect(result.totalEndpoints).toBeGreaterThan(0);
      expect(result.successfulEndpoints).toBeGreaterThan(0);
      expect(result.failedEndpoints).toBe(0);
      expect(result.endpointResults).toHaveLength(result.totalEndpoints);
    });

    it('should handle missing mapping configuration', async () => {
      // Arrange
      const sendPatientDataDto: SendPatientDataDto = {
        ehrName: 'Athena',
        patientData: mockPatientData,
        language: 'en'
      };

      mockCacheService.getEhrMapping.mockResolvedValue(null);
      mockEhrMappingRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.sendPatientDataToMultipleEndpoints(sendPatientDataDto))
        .rejects.toThrow('errors.mappingNotFound');
    });

    it('should handle endpoint failures gracefully', async () => {
      // Arrange
      const sendPatientDataDto: SendPatientDataDto = {
        ehrName: 'Athena',
        patientData: mockPatientData,
        language: 'en'
      };

      mockCacheService.getEhrMapping.mockResolvedValue(null);
      mockEhrMappingRepository.findOne.mockResolvedValue(mockEhrMapping);
      mockCacheService.setEhrMapping.mockResolvedValue();
      mockTransactionLogRepository.create.mockReturnValue({
        id: 1,
        ehrName: 'Athena',
        patientData: mockPatientData,
        status: 'pending'
      } as any);
      mockTransactionLogRepository.save.mockResolvedValue({
        id: 1,
        ehrName: 'Athena',
        patientData: mockPatientData,
        status: 'pending'
      } as any);

      // Make strategy fail for some endpoints
      mockAthenaStrategy.sendData
        .mockResolvedValueOnce({ success: true, transactionId: 'ATHENA-123' })
        .mockRejectedValueOnce(new Error('Endpoint failure'));

      // Act
      const result = await service.sendPatientDataToMultipleEndpoints(sendPatientDataDto);

      // Assert
      expect(result.overallSuccess).toBe(false);
      expect(result.failedEndpoints).toBeGreaterThan(0);
    });
  });

  describe('sendPatientDataToMultipleEndpointsAsync', () => {
    it('should queue patient data for async processing', async () => {
      // Arrange
      const sendPatientDataDto: SendPatientDataDto = {
        ehrName: 'Athena',
        patientData: mockPatientData,
        language: 'en'
      };

      mockTransactionLogRepository.create.mockReturnValue({
        id: 1,
        ehrName: 'Athena',
        patientData: mockPatientData,
        status: 'queued'
      } as any);
      mockTransactionLogRepository.save.mockResolvedValue({
        id: 1,
        ehrName: 'Athena',
        patientData: mockPatientData,
        status: 'queued'
      } as any);
      mockQueueService.addEhrJob.mockResolvedValue({ id: 'job-123' });
      mockCacheService.setTransactionStatus.mockResolvedValue();

      // Act
      const result = await service.sendPatientDataToMultipleEndpointsAsync(sendPatientDataDto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.jobId).toBe('job-123');
      expect(result.transactionId).toBe(1);
      expect(result.multiEndpoint).toBe(true);
      expect(mockQueueService.addEhrJob).toHaveBeenCalledWith({
        ehrName: 'Athena',
        patientData: mockPatientData,
        language: 'en',
        transactionId: '1',
        multiEndpoint: true
      });
    });
  });

  describe('getEhrEndpoints', () => {
    it('should return available endpoints for an EHR system', async () => {
      // Arrange
      mockCacheService.getEhrMapping.mockResolvedValue(null);
      mockEhrMappingRepository.findOne.mockResolvedValue(mockEhrMapping);

      // Act
      const result = await service.getEhrEndpoints('Athena');

      // Assert
      expect(result).toHaveLength(4);
      expect(result[0].endpointName).toBe('patient_demographics');
      expect(result[0].supportedFields).toContain('firstName');
      expect(result[1].endpointName).toBe('medical_history');
      expect(result[1].supportedFields).toContain('medicalHistory');
    });

    it('should throw error for unknown EHR system', async () => {
      // Arrange
      mockCacheService.getEhrMapping.mockResolvedValue(null);
      mockEhrMappingRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getEhrEndpoints('UnknownEHR'))
        .rejects.toThrow('No mapping configuration found for EHR: UnknownEHR');
    });
  });

  describe('getEndpointFieldMappings', () => {
    it('should return field mappings for a specific endpoint', async () => {
      // Arrange
      mockCacheService.getEhrMapping.mockResolvedValue(null);
      mockEhrMappingRepository.findOne.mockResolvedValue(mockEhrMapping);

      // Act
      const result = await service.getEndpointFieldMappings('Athena', 'patient_demographics');

      // Assert
      expect(result).toEqual({
        firstName: 'PATIENT_FIRST_NAME',
        lastName: 'PATIENT_LAST_NAME',
        gender: 'GENDER_OF_PATIENT',
        age: 'AGE_PATIENT',
        'contact.email': 'PATIENT_EMAIL_ID',
        'contact.phone': 'TELEPHONE_NUMBER_PATIENT'
      });
    });

    it('should throw error for unknown endpoint', async () => {
      // Arrange
      mockCacheService.getEhrMapping.mockResolvedValue(null);
      mockEhrMappingRepository.findOne.mockResolvedValue(mockEhrMapping);

      // Act & Assert
      await expect(service.getEndpointFieldMappings('Athena', 'unknown_endpoint'))
        .rejects.toThrow('No field mappings found for endpoint: unknown_endpoint');
    });
  });

  describe('determineTargetEndpoints', () => {
    it('should determine relevant endpoints based on patient data', () => {
      // Arrange
      const patientDataWithAllFields = {
        ...mockPatientData,
        medicalHistory: 'Previous surgery',
        socialHistory: 'Non-smoker',
        familyHistory: 'Mother: diabetes'
      };

      // Act
      const result = service['determineTargetEndpoints'](patientDataWithAllFields, mockEhrMapping.mappingConfig);

      // Assert
      expect(result).toContain('patient_demographics');
      expect(result).toContain('medical_history');
      expect(result).toContain('social_history');
      expect(result).toContain('family_history');
    });

    it('should only include endpoints with relevant data', () => {
      // Arrange
      const patientDataWithLimitedFields = {
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        gender: 'male',
        contact: { email: 'john@example.com', phone: '555-123-4567' }
        // No medical history, social history, or family history
      };

      // Act
      const result = service['determineTargetEndpoints'](patientDataWithLimitedFields, mockEhrMapping.mappingConfig);

      // Assert
      expect(result).toContain('patient_demographics');
      expect(result).not.toContain('medical_history');
      expect(result).not.toContain('social_history');
      expect(result).not.toContain('family_history');
    });
  });

  describe('mapDataForEndpoint', () => {
    it('should map patient data for a specific endpoint', () => {
      // Arrange
      const endpointName = 'patient_demographics';
      const mappingConfig = mockEhrMapping.mappingConfig;

      // Act
      const result = service['mapDataForEndpoint'](mockPatientData, endpointName, mappingConfig);

      // Assert
      expect(result).toEqual({
        PATIENT_FIRST_NAME: 'John',
        PATIENT_LAST_NAME: 'Doe',
        GENDER_OF_PATIENT: 'male',
        AGE_PATIENT: 30,
        PATIENT_EMAIL_ID: 'john@example.com',
        TELEPHONE_NUMBER_PATIENT: '555-123-4567'
      });
    });

    it('should handle missing fields gracefully', () => {
      // Arrange
      const endpointName = 'medical_history';
      const mappingConfig = mockEhrMapping.mappingConfig;
      const patientDataWithoutMedicalHistory = {
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        gender: 'male',
        contact: { email: 'john@example.com', phone: '555-123-4567' }
        // No medical history fields
      };

      // Act
      const result = service['mapDataForEndpoint'](patientDataWithoutMedicalHistory, endpointName, mappingConfig);

      // Assert
      expect(result).toEqual({});
    });
  });
});
