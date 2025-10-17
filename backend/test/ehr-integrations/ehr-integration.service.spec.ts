import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { EhrIntegrationService } from '../../src/ehr-integrations/ehr-integration.service';
import { EhrMapping } from '../../src/ehr-integrations/ehr-mapping.entity';
import { TransactionLog } from '../../src/ehr-integrations/entities/transaction-log.entity';
import { AthenaStrategy } from '../../src/ehr-integrations/athena/athena.strategy';
import { AllscriptsStrategy } from '../../src/ehr-integrations/allscripts/allscripts.strategy';
import { PatientDataDto } from '../../src/ehr-integrations/dto/patient-data.dto';

describe('EhrIntegrationService', () => {
  let service: EhrIntegrationService;
  let ehrMappingRepository: Repository<EhrMapping>;
  let transactionLogRepository: Repository<TransactionLog>;
  let athenaStrategy: AthenaStrategy;
  let allscriptsStrategy: AllscriptsStrategy;

  const mockEhrMappingRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTransactionLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAthenaStrategy = {
    getEHRName: jest.fn().mockReturnValue('Athena'),
    mapData: jest.fn(),
    sendData: jest.fn(),
  };

  const mockAllscriptsStrategy = {
    getEHRName: jest.fn().mockReturnValue('Allscripts'),
    mapData: jest.fn(),
    sendData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EhrIntegrationService,
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
      ],
    }).compile();

    service = module.get<EhrIntegrationService>(EhrIntegrationService);
    ehrMappingRepository = module.get<Repository<EhrMapping>>(getRepositoryToken(EhrMapping));
    transactionLogRepository = module.get<Repository<TransactionLog>>(getRepositoryToken(TransactionLog));
    athenaStrategy = module.get<AthenaStrategy>(AthenaStrategy);
    allscriptsStrategy = module.get<AllscriptsStrategy>(AllscriptsStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStrategy', () => {
    it('should return Athena strategy for Athena', () => {
      const strategy = service.getStrategy('Athena');
      expect(strategy).toBe(athenaStrategy);
    });

    it('should return Allscripts strategy for Allscripts', () => {
      const strategy = service.getStrategy('Allscripts');
      expect(strategy).toBe(allscriptsStrategy);
    });

    it('should throw error for unknown EHR', () => {
      expect(() => service.getStrategy('unknown-ehr')).toThrow(InternalServerErrorException);
    });
  });

  describe('sendPatientData', () => {
    const validPatientData: PatientDataDto = {
      firstName: 'John',
      lastName: 'Doe',
      age: 30,
      gender: 'male',
      contact: {
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        address: '123 Main St'
      },
      allergies: ['peanuts'],
      medications: ['aspirin'],
      medicalHistory: 'No significant history',
      symptoms: 'Headache'
    };

    const mockEhrMapping = {
      id: 1,
      ehrName: 'Athena',
      mappingConfig: {
        'firstName': 'patient_name',
        'contact.email': 'email_address'
      }
    };

    const mockTransactionLog = {
      id: 1,
      ehrName: 'Athena',
      patientData: validPatientData,
      status: 'pending',
      retryCount: 0
    };

    beforeEach(() => {
      mockEhrMappingRepository.findOne.mockResolvedValue(mockEhrMapping);
      mockTransactionLogRepository.create.mockReturnValue(mockTransactionLog);
      mockTransactionLogRepository.save.mockResolvedValue(mockTransactionLog);
      mockAthenaStrategy.mapData.mockReturnValue({ mapped: 'data' });
      mockAthenaStrategy.sendData.mockResolvedValue({
        success: true,
        transactionId: 'ATHENA-123',
        data: { mapped: 'data' }
      });
    });

    it('should successfully send patient data', async () => {
      const result = await service.sendPatientData('Athena', validPatientData);

      expect(mockEhrMappingRepository.findOne).toHaveBeenCalledWith({ where: { ehrName: 'Athena' } });
      expect(mockTransactionLogRepository.create).toHaveBeenCalledWith({
        ehrName: 'Athena',
        patientData: validPatientData,
        status: 'pending',
        retryCount: 0
      });
      expect(mockAthenaStrategy.mapData).toHaveBeenCalledWith(validPatientData, mockEhrMapping.mappingConfig);
      expect(mockAthenaStrategy.sendData).toHaveBeenCalledWith({ mapped: 'data' });
      expect(result.success).toBe(true);
    });

    it('should throw error if EHR mapping not found', async () => {
      mockEhrMappingRepository.findOne.mockResolvedValue(null);

      await expect(service.sendPatientData('Athena', validPatientData))
        .rejects.toThrow(NotFoundException);
    });

    it('should validate patient data and throw error for invalid data', async () => {
      const invalidPatientData = { ...validPatientData, firstName: '' };

      await expect(service.sendPatientData('Athena', invalidPatientData))
        .rejects.toThrow(BadRequestException);
    });

    it('should handle EHR strategy errors', async () => {
      mockAthenaStrategy.sendData.mockRejectedValue(new Error('Athena API error'));

      await expect(service.sendPatientData('Athena', validPatientData))
        .rejects.toThrow('Athena API error');

      expect(mockTransactionLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          errorMessage: 'Athena API error'
        })
      );
    });
  });

  describe('saveEhrMapping', () => {
    it('should save new EHR mapping', async () => {
      const ehrName = 'Athena';
      const mappingConfig = { 'firstName': 'patient_name' };
      const mockMapping = { id: 1, ehrName, mappingConfig };

      mockEhrMappingRepository.findOne.mockResolvedValue(null);
      mockEhrMappingRepository.create.mockReturnValue(mockMapping);
      mockEhrMappingRepository.save.mockResolvedValue(mockMapping);

      const result = await service.saveEhrMapping(ehrName, mappingConfig);

      expect(mockEhrMappingRepository.create).toHaveBeenCalledWith({ ehrName, mappingConfig });
      expect(mockEhrMappingRepository.save).toHaveBeenCalledWith(mockMapping);
      expect(result).toBe(mockMapping);
    });

    it('should update existing EHR mapping', async () => {
      const ehrName = 'Athena';
      const mappingConfig = { 'firstName': 'patient_name' };
      const existingMapping = { id: 1, ehrName, mappingConfig: { old: 'config' } };

      mockEhrMappingRepository.findOne.mockResolvedValue(existingMapping);
      mockEhrMappingRepository.save.mockResolvedValue({ ...existingMapping, mappingConfig });

      const result = await service.saveEhrMapping(ehrName, mappingConfig);

      expect(existingMapping.mappingConfig).toBe(mappingConfig);
      expect(mockEhrMappingRepository.save).toHaveBeenCalledWith(existingMapping);
      expect(result).toEqual({ ...existingMapping, mappingConfig });
    });

    it('should validate mapping configuration', async () => {
      await expect(service.saveEhrMapping('Athena', null))
        .rejects.toThrow(BadRequestException);

      await expect(service.saveEhrMapping('Athena', {}))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getEhrMapping', () => {
    it('should return EHR mapping', async () => {
      const mockMapping = { id: 1, ehrName: 'Athena', mappingConfig: {} };
      mockEhrMappingRepository.findOne.mockResolvedValue(mockMapping);

      const result = await service.getEhrMapping('Athena');

      expect(mockEhrMappingRepository.findOne).toHaveBeenCalledWith({ where: { ehrName: 'Athena' } });
      expect(result).toBe(mockMapping);
    });

    it('should throw error if mapping not found', async () => {
      mockEhrMappingRepository.findOne.mockResolvedValue(null);

      await expect(service.getEhrMapping('Athena'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getTransactionLogs', () => {
    it('should return transaction logs', async () => {
      const mockLogs = [{ id: 1, ehrName: 'Athena', status: 'success' }];
      mockTransactionLogRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getTransactionLogs();

      expect(mockTransactionLogRepository.find).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
        take: 100
      });
      expect(result).toBe(mockLogs);
    });

    it('should filter by EHR name and status', async () => {
      const mockLogs = [{ id: 1, ehrName: 'Athena', status: 'success' }];
      mockTransactionLogRepository.find.mockResolvedValue(mockLogs);

      await service.getTransactionLogs('Athena', 'success');

      expect(mockTransactionLogRepository.find).toHaveBeenCalledWith({
        where: { ehrName: 'Athena', status: 'success' },
        order: { createdAt: 'DESC' },
        take: 100
      });
    });
  });

  describe('retryFailedTransaction', () => {
    it('should retry failed transaction', async () => {
      const transactionId = 1;
      const mockTransaction = {
        id: transactionId,
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
        },
        status: 'failed',
        retryCount: 0
      };

      mockTransactionLogRepository.findOne.mockResolvedValue(mockTransaction);
      mockTransactionLogRepository.save.mockResolvedValue(mockTransaction);
      mockEhrMappingRepository.findOne.mockResolvedValue({ mappingConfig: {} });
      mockAthenaStrategy.mapData.mockReturnValue({ mapped: 'data' });
      mockAthenaStrategy.sendData.mockResolvedValue({ success: true });

      const result = await service.retryFailedTransaction(transactionId);

      expect(mockTransactionLogRepository.findOne).toHaveBeenCalledWith({ where: { id: transactionId } });
      expect(mockTransaction.retryCount).toBe(1);
      expect(mockTransaction.status).toBe('retrying');
      expect(result.success).toBe(true);
    });

    it('should throw error if transaction not found', async () => {
      mockTransactionLogRepository.findOne.mockResolvedValue(null);

      await expect(service.retryFailedTransaction(1))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw error if transaction is not in failed state', async () => {
      const mockTransaction = { id: 1, status: 'success' };
      mockTransactionLogRepository.findOne.mockResolvedValue(mockTransaction);

      await expect(service.retryFailedTransaction(1))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('validatePatientData', () => {
    it('should validate required fields', () => {
      const invalidData = { firstName: '', lastName: 'Doe', age: 30, contact: { email: 'test@example.com', phone: '123-456-7890' } };
      
      expect(() => service['validatePatientData'](invalidData as any))
        .toThrow(BadRequestException);
    });

    it('should validate contact information', () => {
      const invalidData = { firstName: 'John', lastName: 'Doe', age: 30, contact: { email: '', phone: '123-456-7890' } };
      
      expect(() => service['validatePatientData'](invalidData as any))
        .toThrow(BadRequestException);
    });

    it('should validate age range', () => {
      const invalidData = { firstName: 'John', lastName: 'Doe', age: -1, contact: { email: 'test@example.com', phone: '123-456-7890' } };
      
      expect(() => service['validatePatientData'](invalidData as any))
        .toThrow(BadRequestException);
    });
  });
});
