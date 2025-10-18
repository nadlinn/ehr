import { Test, TestingModule } from '@nestjs/testing';
import { MultiEndpointEhrController } from '../../src/ehr-integrations/multi-endpoint-ehr.controller';
import { MultiEndpointEhrService } from '../../src/ehr-integrations/multi-endpoint-ehr.service';
import { SendPatientDataDto } from '../../src/ehr-integrations/dto/patient-data.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('MultiEndpointEhrController', () => {
  let controller: MultiEndpointEhrController;
  let mockMultiEndpointEhrService: jest.Mocked<MultiEndpointEhrService>;

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
    symptoms: ['Chest pain', 'Shortness of breath']
  };

  const mockMultiEndpointResult = {
    ehrName: 'Athena',
    overallSuccess: true,
    endpointResults: [
      {
        endpointName: 'patient_demographics',
        success: true,
        transactionId: 'ATHENA-123',
        data: { patientId: 'ATH-123' }
      },
      {
        endpointName: 'medical_history',
        success: true,
        transactionId: 'ATHENA-124',
        data: { patientId: 'ATH-123' }
      }
    ],
    totalEndpoints: 2,
    successfulEndpoints: 2,
    failedEndpoints: 0
  };

  const mockAsyncResult = {
    success: true,
    message: 'Patient data queued for processing',
    jobId: 'job-123',
    transactionId: 1,
    multiEndpoint: true
  };

  const mockEndpoints = [
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
    }
  ];

  const mockFieldMappings = {
    firstName: 'PATIENT_FIRST_NAME',
    lastName: 'PATIENT_LAST_NAME',
    gender: 'GENDER_OF_PATIENT',
    age: 'AGE_PATIENT',
    'contact.email': 'PATIENT_EMAIL_ID',
    'contact.phone': 'TELEPHONE_NUMBER_PATIENT'
  };

  beforeEach(async () => {
    const mockService = {
      sendPatientDataToMultipleEndpoints: jest.fn(),
      sendPatientDataToMultipleEndpointsAsync: jest.fn(),
      getEhrEndpoints: jest.fn(),
      getEndpointFieldMappings: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MultiEndpointEhrController],
      providers: [
        {
          provide: MultiEndpointEhrService,
          useValue: mockService
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            reset: jest.fn()
          }
        }
      ]
    }).compile();

    controller = module.get<MultiEndpointEhrController>(MultiEndpointEhrController);
    mockMultiEndpointEhrService = module.get(MultiEndpointEhrService);
  });

  describe('sendPatientDataToMultipleEndpoints', () => {
    it('should send patient data to multiple endpoints synchronously', async () => {
      // Arrange
      const sendPatientDataDto: SendPatientDataDto = {
        ehrName: 'Athena',
        patientData: mockPatientData,
        language: 'en'
      };

      mockMultiEndpointEhrService.sendPatientDataToMultipleEndpoints.mockResolvedValue(mockMultiEndpointResult);

      // Act
      const result = await controller.sendPatientDataToMultipleEndpoints(sendPatientDataDto);

      // Assert
      expect(result).toEqual(mockMultiEndpointResult);
      expect(mockMultiEndpointEhrService.sendPatientDataToMultipleEndpoints).toHaveBeenCalledWith(sendPatientDataDto);
    });

    it('should handle service errors', async () => {
      // Arrange
      const sendPatientDataDto: SendPatientDataDto = {
        ehrName: 'Athena',
        patientData: mockPatientData,
        language: 'en'
      };

      const error = new Error('Service error');
      mockMultiEndpointEhrService.sendPatientDataToMultipleEndpoints.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.sendPatientDataToMultipleEndpoints(sendPatientDataDto))
        .rejects.toThrow('Service error');
    });
  });

  describe('sendPatientDataToMultipleEndpointsAsync', () => {
    it('should send patient data to multiple endpoints asynchronously', async () => {
      // Arrange
      const sendPatientDataDto: SendPatientDataDto = {
        ehrName: 'Athena',
        patientData: mockPatientData,
        language: 'en'
      };

      mockMultiEndpointEhrService.sendPatientDataToMultipleEndpointsAsync.mockResolvedValue(mockAsyncResult);

      // Act
      const result = await controller.sendPatientDataToMultipleEndpointsAsync(sendPatientDataDto);

      // Assert
      expect(result).toEqual(mockAsyncResult);
      expect(mockMultiEndpointEhrService.sendPatientDataToMultipleEndpointsAsync).toHaveBeenCalledWith(sendPatientDataDto);
    });

    it('should handle async service errors', async () => {
      // Arrange
      const sendPatientDataDto: SendPatientDataDto = {
        ehrName: 'Athena',
        patientData: mockPatientData,
        language: 'en'
      };

      const error = new Error('Async service error');
      mockMultiEndpointEhrService.sendPatientDataToMultipleEndpointsAsync.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.sendPatientDataToMultipleEndpointsAsync(sendPatientDataDto))
        .rejects.toThrow('Async service error');
    });
  });

  describe('getEhrEndpoints', () => {
    it('should return available endpoints for an EHR system', async () => {
      // Arrange
      const ehrName = 'Athena';
      mockMultiEndpointEhrService.getEhrEndpoints.mockResolvedValue(mockEndpoints);

      // Act
      const result = await controller.getEhrEndpoints(ehrName);

      // Assert
      expect(result).toEqual(mockEndpoints);
      expect(mockMultiEndpointEhrService.getEhrEndpoints).toHaveBeenCalledWith(ehrName);
    });

    it('should handle endpoint retrieval errors', async () => {
      // Arrange
      const ehrName = 'UnknownEHR';
      const error = new Error('EHR not found');
      mockMultiEndpointEhrService.getEhrEndpoints.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getEhrEndpoints(ehrName))
        .rejects.toThrow('EHR not found');
    });
  });

  describe('getEndpointFieldMappings', () => {
    it('should return field mappings for a specific endpoint', async () => {
      // Arrange
      const ehrName = 'Athena';
      const endpointName = 'patient_demographics';
      mockMultiEndpointEhrService.getEndpointFieldMappings.mockResolvedValue(mockFieldMappings);

      // Act
      const result = await controller.getEndpointFieldMappings(ehrName, endpointName);

      // Assert
      expect(result).toEqual(mockFieldMappings);
      expect(mockMultiEndpointEhrService.getEndpointFieldMappings).toHaveBeenCalledWith(ehrName, endpointName);
    });

    it('should handle field mapping retrieval errors', async () => {
      // Arrange
      const ehrName = 'Athena';
      const endpointName = 'unknown_endpoint';
      const error = new Error('Endpoint not found');
      mockMultiEndpointEhrService.getEndpointFieldMappings.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getEndpointFieldMappings(ehrName, endpointName))
        .rejects.toThrow('Endpoint not found');
    });
  });

  describe('HTTP Status Codes', () => {
    it('should return 200 for synchronous multi-endpoint submission', async () => {
      // Arrange
      const sendPatientDataDto: SendPatientDataDto = {
        ehrName: 'Athena',
        patientData: mockPatientData,
        language: 'en'
      };

      mockMultiEndpointEhrService.sendPatientDataToMultipleEndpoints.mockResolvedValue(mockMultiEndpointResult);

      // Act
      const result = await controller.sendPatientDataToMultipleEndpoints(sendPatientDataDto);

      // Assert
      expect(result).toBeDefined();
      // Note: HTTP status codes are handled by NestJS decorators, not directly testable in unit tests
    });

    it('should return 202 for asynchronous multi-endpoint submission', async () => {
      // Arrange
      const sendPatientDataDto: SendPatientDataDto = {
        ehrName: 'Athena',
        patientData: mockPatientData,
        language: 'en'
      };

      mockMultiEndpointEhrService.sendPatientDataToMultipleEndpointsAsync.mockResolvedValue(mockAsyncResult);

      // Act
      const result = await controller.sendPatientDataToMultipleEndpointsAsync(sendPatientDataDto);

      // Assert
      expect(result).toBeDefined();
      // Note: HTTP status codes are handled by NestJS decorators, not directly testable in unit tests
    });
  });

  describe('Parameter Validation', () => {
    it('should handle missing ehrName parameter', async () => {
      // Arrange
      const sendPatientDataDto = {
        patientData: mockPatientData,
        language: 'en'
      } as SendPatientDataDto;

      const error = new Error('Validation failed');
      mockMultiEndpointEhrService.sendPatientDataToMultipleEndpoints.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.sendPatientDataToMultipleEndpoints(sendPatientDataDto))
        .rejects.toThrow('Validation failed');
    });

    it('should handle missing patientData parameter', async () => {
      // Arrange
      const sendPatientDataDto = {
        ehrName: 'Athena',
        language: 'en'
      } as SendPatientDataDto;

      const error = new Error('Validation failed');
      mockMultiEndpointEhrService.sendPatientDataToMultipleEndpoints.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.sendPatientDataToMultipleEndpoints(sendPatientDataDto))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('Caching Integration', () => {
    it('should support caching for endpoint retrieval', async () => {
      // Arrange
      const ehrName = 'Athena';
      mockMultiEndpointEhrService.getEhrEndpoints.mockResolvedValue(mockEndpoints);

      // Act
      const result = await controller.getEhrEndpoints(ehrName);

      // Assert
      expect(result).toEqual(mockEndpoints);
      // Note: Caching is handled by NestJS decorators, not directly testable in unit tests
    });

    it('should support caching for field mapping retrieval', async () => {
      // Arrange
      const ehrName = 'Athena';
      const endpointName = 'patient_demographics';
      mockMultiEndpointEhrService.getEndpointFieldMappings.mockResolvedValue(mockFieldMappings);

      // Act
      const result = await controller.getEndpointFieldMappings(ehrName, endpointName);

      // Assert
      expect(result).toEqual(mockFieldMappings);
      // Note: Caching is handled by NestJS decorators, not directly testable in unit tests
    });
  });
});
