import { Test, TestingModule } from '@nestjs/testing';
import { EhrController } from '../../src/ehr-integrations/ehr.controller';
import { EhrIntegrationService } from '../../src/ehr-integrations/ehr-integration.service';
import { SendPatientDataDto, EhrMappingDto } from '../../src/ehr-integrations/dto/patient-data.dto';

describe('EhrController', () => {
  let controller: EhrController;
  let service: EhrIntegrationService;

  const mockService = {
    sendPatientData: jest.fn(),
    saveEhrMapping: jest.fn(),
    getEhrMapping: jest.fn(),
    getTransactionLogs: jest.fn(),
    retryFailedTransaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EhrController],
      providers: [
        {
          provide: EhrIntegrationService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<EhrController>(EhrController);
    service = module.get<EhrIntegrationService>(EhrIntegrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendPatientData', () => {
    it('should send patient data', async () => {
      const sendPatientDataDto: SendPatientDataDto = {
        ehrName: 'Athena',
        patientData: {
          firstName: 'John',
          lastName: 'Doe',
          age: 30,
          gender: 'male',
          contact: {
            email: 'john@example.com',
            phone: '123-456-7890'
          }
        }
      };

      const expectedResult = { success: true, transactionId: 'ATHENA-123' };
      mockService.sendPatientData.mockResolvedValue(expectedResult);

      const result = await controller.sendPatientData(sendPatientDataDto);

      expect(mockService.sendPatientData).toHaveBeenCalledWith(
        sendPatientDataDto.ehrName,
        sendPatientDataDto.patientData
      );
      expect(result).toBe(expectedResult);
    });
  });

  describe('saveMapping', () => {
    it('should save EHR mapping', async () => {
      const ehrMappingDto: EhrMappingDto = {
        ehrName: 'Athena',
        mappingConfig: {
          'firstName': 'patient_name',
          'contact.email': 'email_address'
        }
      };

      const expectedResult = { id: 1, ehrName: 'Athena', mappingConfig: ehrMappingDto.mappingConfig };
      mockService.saveEhrMapping.mockResolvedValue(expectedResult);

      const result = await controller.saveMapping(ehrMappingDto);

      expect(mockService.saveEhrMapping).toHaveBeenCalledWith(
        ehrMappingDto.ehrName,
        ehrMappingDto.mappingConfig
      );
      expect(result).toBe(expectedResult);
    });
  });

  describe('getMapping', () => {
    it('should get EHR mapping', async () => {
      const ehrName = 'Athena';
      const expectedResult = { id: 1, ehrName, mappingConfig: {} };
      mockService.getEhrMapping.mockResolvedValue(expectedResult);

      const result = await controller.getMapping(ehrName);

      expect(mockService.getEhrMapping).toHaveBeenCalledWith(ehrName);
      expect(result).toBe(expectedResult);
    });
  });

  describe('getTransactionLogs', () => {
    it('should get transaction logs without filters', async () => {
      const expectedResult = [{ id: 1, ehrName: 'Athena', status: 'success' }];
      mockService.getTransactionLogs.mockResolvedValue(expectedResult);

      const result = await controller.getTransactionLogs();

      expect(mockService.getTransactionLogs).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toBe(expectedResult);
    });

    it('should get transaction logs with filters', async () => {
      const ehrName = 'Athena';
      const status = 'success';
      const expectedResult = [{ id: 1, ehrName, status }];
      mockService.getTransactionLogs.mockResolvedValue(expectedResult);

      const result = await controller.getTransactionLogs(ehrName, status);

      expect(mockService.getTransactionLogs).toHaveBeenCalledWith(ehrName, status);
      expect(result).toBe(expectedResult);
    });
  });

  describe('retryTransaction', () => {
    it('should retry failed transaction', async () => {
      const transactionId = 1;
      const expectedResult = { success: true, transactionId: 'ATHENA-123' };
      mockService.retryFailedTransaction.mockResolvedValue(expectedResult);

      const result = await controller.retryTransaction(transactionId);

      expect(mockService.retryFailedTransaction).toHaveBeenCalledWith(transactionId);
      expect(result).toBe(expectedResult);
    });
  });
});
