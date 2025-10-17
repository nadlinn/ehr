import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AthenaStrategy } from '../../../src/ehr-integrations/athena/athena.strategy';
import { AthenaMappingService } from '../../../src/ehr-integrations/athena/athena.mapping.service';
import { PatientDataDto } from '../../../src/ehr-integrations/dto/patient-data.dto';

describe('AthenaStrategy', () => {
  let strategy: AthenaStrategy;
  let mappingService: AthenaMappingService;

  const mockMappingService = {
    applyMapping: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AthenaStrategy,
        {
          provide: AthenaMappingService,
          useValue: mockMappingService,
        },
      ],
    }).compile();

    strategy = module.get<AthenaStrategy>(AthenaStrategy);
    mappingService = module.get<AthenaMappingService>(AthenaMappingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEHRName', () => {
    it('should return Athena', () => {
      expect(strategy.getEHRName()).toBe('Athena');
    });
  });

  describe('sendData', () => {
    it('should successfully send data to Athena', async () => {
      const patientData = { name: 'John Doe', age: 30 };
      
      const result = await strategy.sendData(patientData);

      expect(result).toEqual({
        success: true,
        ehr: 'Athena',
        transactionId: expect.stringMatching(/^ATHENA-\d+$/),
        data: patientData,
        timestamp: expect.any(String)
      });
    });

    it('should handle API errors', async () => {
      // Mock the private method to throw an error
      jest.spyOn(strategy as any, 'callAthenaApi').mockRejectedValue(new Error('API Error'));

      await expect(strategy.sendData({}))
        .rejects.toThrow(HttpException);
    });
  });

  describe('mapData', () => {
    it('should apply mapping using mapping service', () => {
      const patientData: PatientDataDto = {
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        gender: 'male',
        contact: {
          email: 'john@example.com',
          phone: '123-456-7890'
        }
      };
      const mappingConfig = { 'firstName': 'patient_name' };
      const expectedMappedData = { patient_name: 'John' };

      mockMappingService.applyMapping.mockReturnValue(expectedMappedData);

      const result = strategy.mapData(patientData, mappingConfig);

      expect(mockMappingService.applyMapping).toHaveBeenCalledWith(patientData, mappingConfig);
      expect(result).toBe(expectedMappedData);
    });
  });
});
