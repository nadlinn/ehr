import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../../src/cache/cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('basic cache operations', () => {
    it('should get value from cache', async () => {
      const mockValue = { test: 'data' };
      cacheManager.get.mockResolvedValue(mockValue);

      const result = await service.get('test-key');

      expect(result).toEqual(mockValue);
      expect(cacheManager.get).toHaveBeenCalledWith('test-key');
    });

    it('should set value in cache', async () => {
      const mockValue = { test: 'data' };
      cacheManager.set.mockResolvedValue(undefined);

      await service.set('test-key', mockValue, 3600);

      expect(cacheManager.set).toHaveBeenCalledWith('test-key', mockValue, 3600);
    });

    it('should set value in cache without TTL', async () => {
      const mockValue = { test: 'data' };
      cacheManager.set.mockResolvedValue(undefined);

      await service.set('test-key', mockValue);

      expect(cacheManager.set).toHaveBeenCalledWith('test-key', mockValue, undefined);
    });

    it('should delete value from cache', async () => {
      cacheManager.del.mockResolvedValue(undefined);

      await service.del('test-key');

      expect(cacheManager.del).toHaveBeenCalledWith('test-key');
    });

    it('should reset cache', async () => {
      cacheManager.reset.mockResolvedValue(undefined);

      await service.reset();

      expect(cacheManager.reset).toHaveBeenCalled();
    });
  });

  describe('EHR mapping cache operations', () => {
    it('should get EHR mapping from cache', async () => {
      const mockMapping = { patient: { firstName: 'PATIENT_FIRST_NAME' } };
      cacheManager.get.mockResolvedValue(mockMapping);

      const result = await service.getEhrMapping('Athena');

      expect(result).toEqual(mockMapping);
      expect(cacheManager.get).toHaveBeenCalledWith('ehr_mapping_Athena');
    });

    it('should set EHR mapping in cache', async () => {
      const mockMapping = { patient: { firstName: 'PATIENT_FIRST_NAME' } };
      cacheManager.set.mockResolvedValue(undefined);

      await service.setEhrMapping('Athena', mockMapping, 3600);

      expect(cacheManager.set).toHaveBeenCalledWith('ehr_mapping_Athena', mockMapping, 3600);
    });

    it('should set EHR mapping with default TTL', async () => {
      const mockMapping = { patient: { firstName: 'PATIENT_FIRST_NAME' } };
      cacheManager.set.mockResolvedValue(undefined);

      await service.setEhrMapping('Athena', mockMapping);

      expect(cacheManager.set).toHaveBeenCalledWith('ehr_mapping_Athena', mockMapping, 3600);
    });

    it('should invalidate EHR mapping cache', async () => {
      cacheManager.del.mockResolvedValue(undefined);

      await service.invalidateEhrMapping('Athena');

      expect(cacheManager.del).toHaveBeenCalledWith('ehr_mapping_Athena');
    });
  });

  describe('patient data cache operations', () => {
    it('should get patient data from cache', async () => {
      const mockPatientData = { firstName: 'John', lastName: 'Doe' };
      cacheManager.get.mockResolvedValue(mockPatientData);

      const result = await service.getPatientData('patient-123');

      expect(result).toEqual(mockPatientData);
      expect(cacheManager.get).toHaveBeenCalledWith('patient_data_patient-123');
    });

    it('should set patient data in cache', async () => {
      const mockPatientData = { firstName: 'John', lastName: 'Doe' };
      cacheManager.set.mockResolvedValue(undefined);

      await service.setPatientData('patient-123', mockPatientData, 1800);

      expect(cacheManager.set).toHaveBeenCalledWith('patient_data_patient-123', mockPatientData, 1800);
    });

    it('should set patient data with default TTL', async () => {
      const mockPatientData = { firstName: 'John', lastName: 'Doe' };
      cacheManager.set.mockResolvedValue(undefined);

      await service.setPatientData('patient-123', mockPatientData);

      expect(cacheManager.set).toHaveBeenCalledWith('patient_data_patient-123', mockPatientData, 1800);
    });
  });

  describe('transaction status cache operations', () => {
    it('should get transaction status from cache', async () => {
      const mockStatus = { status: 'processing', progress: 50 };
      cacheManager.get.mockResolvedValue(mockStatus);

      const result = await service.getTransactionStatus('txn-123');

      expect(result).toEqual(mockStatus);
      expect(cacheManager.get).toHaveBeenCalledWith('transaction_status_txn-123');
    });

    it('should set transaction status in cache', async () => {
      const mockStatus = { status: 'processing', progress: 50 };
      cacheManager.set.mockResolvedValue(undefined);

      await service.setTransactionStatus('txn-123', mockStatus, 300);

      expect(cacheManager.set).toHaveBeenCalledWith('transaction_status_txn-123', mockStatus, 300);
    });

    it('should set transaction status with default TTL', async () => {
      const mockStatus = { status: 'processing', progress: 50 };
      cacheManager.set.mockResolvedValue(undefined);

      await service.setTransactionStatus('txn-123', mockStatus);

      expect(cacheManager.set).toHaveBeenCalledWith('transaction_status_txn-123', mockStatus, 300);
    });
  });

  describe('error handling', () => {
    it('should handle cache get errors gracefully', async () => {
      cacheManager.get.mockRejectedValue(new Error('Cache error'));

      await expect(service.get('test-key')).rejects.toThrow('Cache error');
    });

    it('should handle cache set errors gracefully', async () => {
      cacheManager.set.mockRejectedValue(new Error('Cache error'));

      await expect(service.set('test-key', 'value')).rejects.toThrow('Cache error');
    });

    it('should handle cache delete errors gracefully', async () => {
      cacheManager.del.mockRejectedValue(new Error('Cache error'));

      await expect(service.del('test-key')).rejects.toThrow('Cache error');
    });
  });

  describe('cache key generation', () => {
    it('should generate correct EHR mapping cache keys', async () => {
      cacheManager.get.mockResolvedValue(null);
      cacheManager.set.mockResolvedValue(undefined);

      await service.getEhrMapping('Athena');
      await service.setEhrMapping('Allscripts', { test: 'data' });

      expect(cacheManager.get).toHaveBeenCalledWith('ehr_mapping_Athena');
      expect(cacheManager.set).toHaveBeenCalledWith('ehr_mapping_Allscripts', { test: 'data' }, 3600);
    });

    it('should generate correct patient data cache keys', async () => {
      cacheManager.get.mockResolvedValue(null);
      cacheManager.set.mockResolvedValue(undefined);

      await service.getPatientData('patient-123');
      await service.setPatientData('patient-456', { test: 'data' });

      expect(cacheManager.get).toHaveBeenCalledWith('patient_data_patient-123');
      expect(cacheManager.set).toHaveBeenCalledWith('patient_data_patient-456', { test: 'data' }, 1800);
    });

    it('should generate correct transaction status cache keys', async () => {
      cacheManager.get.mockResolvedValue(null);
      cacheManager.set.mockResolvedValue(undefined);

      await service.getTransactionStatus('txn-123');
      await service.setTransactionStatus('txn-456', { test: 'data' });

      expect(cacheManager.get).toHaveBeenCalledWith('transaction_status_txn-123');
      expect(cacheManager.set).toHaveBeenCalledWith('transaction_status_txn-456', { test: 'data' }, 300);
    });
  });
});
