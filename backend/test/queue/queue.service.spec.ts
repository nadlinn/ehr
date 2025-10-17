import { Test, TestingModule } from '@nestjs/testing';
import { QueueService, EhrJobData } from '../../src/queue/queue.service';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';

describe('QueueService', () => {
  let service: QueueService;
  let mockQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    const mockQueueInstance = {
      add: jest.fn(),
      getWaiting: jest.fn(),
      getActive: jest.fn(),
      getCompleted: jest.fn(),
      getFailed: jest.fn(),
      getJob: jest.fn(),
      clean: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getQueueToken('ehr-processing'),
          useValue: mockQueueInstance,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    mockQueue = module.get(getQueueToken('ehr-processing'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addEhrJob', () => {
    it('should add EHR job to queue with correct options', async () => {
      const jobData: EhrJobData = {
        ehrName: 'Athena',
        patientData: { firstName: 'John', lastName: 'Doe' },
        transactionId: 'txn-123',
        language: 'en',
      };

      mockQueue.add.mockResolvedValue({} as any);

      await service.addEhrJob(jobData);

      expect(mockQueue.add).toHaveBeenCalledWith('process-ehr', jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      });
    });

    it('should add EHR job with retry count', async () => {
      const jobData: EhrJobData = {
        ehrName: 'Athena',
        patientData: { firstName: 'John', lastName: 'Doe' },
        transactionId: 'txn-123',
        language: 'en',
        retryCount: 2,
      };

      mockQueue.add.mockResolvedValue({} as any);

      await service.addEhrJob(jobData);

      expect(mockQueue.add).toHaveBeenCalledWith('process-ehr', jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      });
    });
  });

  describe('addBulkEhrJobs', () => {
    it('should add multiple EHR jobs to queue', async () => {
      const jobs: EhrJobData[] = [
        {
          ehrName: 'Athena',
          patientData: { firstName: 'John', lastName: 'Doe' },
          transactionId: 'txn-123',
          language: 'en',
        },
        {
          ehrName: 'Allscripts',
          patientData: { firstName: 'Jane', lastName: 'Smith' },
          transactionId: 'txn-456',
          language: 'es',
        },
      ];

      mockQueue.add.mockResolvedValue({} as any);

      await service.addBulkEhrJobs(jobs);

      expect(mockQueue.add).toHaveBeenCalledTimes(2);
      expect(mockQueue.add).toHaveBeenCalledWith('process-ehr', jobs[0], {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      });
      expect(mockQueue.add).toHaveBeenCalledWith('process-ehr', jobs[1], {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      });
    });

    it('should handle empty jobs array', async () => {
      await service.addBulkEhrJobs([]);

      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status with counts', async () => {
      const waitingJobs = [{ id: 1 }, { id: 2 }];
      const activeJobs = [{ id: 3 }];
      const completedJobs = [{ id: 4 }, { id: 5 }, { id: 6 }];
      const failedJobs = [{ id: 7 }];

      mockQueue.getWaiting.mockResolvedValue(waitingJobs as any);
      mockQueue.getActive.mockResolvedValue(activeJobs as any);
      mockQueue.getCompleted.mockResolvedValue(completedJobs as any);
      mockQueue.getFailed.mockResolvedValue(failedJobs as any);

      const result = await service.getQueueStatus();

      expect(result).toEqual({
        waiting: 2,
        active: 1,
        completed: 3,
        failed: 1,
      });

      expect(mockQueue.getWaiting).toHaveBeenCalled();
      expect(mockQueue.getActive).toHaveBeenCalled();
      expect(mockQueue.getCompleted).toHaveBeenCalled();
      expect(mockQueue.getFailed).toHaveBeenCalled();
    });
  });

  describe('getJobStatus', () => {
    it('should return job status for existing job', async () => {
      const mockJob = {
        id: 'job-123',
        data: { ehrName: 'Athena', patientData: {} },
        progress: jest.fn().mockReturnValue(50),
        getState: jest.fn().mockResolvedValue('active'),
        attemptsMade: 1,
        failedReason: null,
      };

      mockQueue.getJob.mockResolvedValue(mockJob as any);

      const result = await service.getJobStatus('job-123');

      expect(result).toEqual({
        id: 'job-123',
        data: { ehrName: 'Athena', patientData: {} },
        progress: 50,
        state: 'active',
        attempts: 1,
        failedReason: null,
      });

      expect(mockQueue.getJob).toHaveBeenCalledWith('job-123');
    });

    it('should return null for non-existent job', async () => {
      mockQueue.getJob.mockResolvedValue(null);

      const result = await service.getJobStatus('non-existent');

      expect(result).toBeNull();
      expect(mockQueue.getJob).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('retryFailedJob', () => {
    it('should retry existing job', async () => {
      const mockJob = {
        retry: jest.fn().mockResolvedValue(undefined),
      };

      mockQueue.getJob.mockResolvedValue(mockJob as any);

      await service.retryFailedJob('job-123');

      expect(mockQueue.getJob).toHaveBeenCalledWith('job-123');
      expect(mockJob.retry).toHaveBeenCalled();
    });

    it('should handle non-existent job gracefully', async () => {
      mockQueue.getJob.mockResolvedValue(null);

      await service.retryFailedJob('non-existent');

      expect(mockQueue.getJob).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('cleanQueue', () => {
    it('should clean queue with correct parameters', async () => {
      mockQueue.clean.mockResolvedValue(undefined);

      await service.cleanQueue();

      expect(mockQueue.clean).toHaveBeenCalledWith(24 * 60 * 60 * 1000);
    });
  });

  describe('error handling', () => {
    it('should handle queue add errors', async () => {
      const jobData: EhrJobData = {
        ehrName: 'Athena',
        patientData: { firstName: 'John', lastName: 'Doe' },
        transactionId: 'txn-123',
      };

      mockQueue.add.mockRejectedValue(new Error('Queue error'));

      await expect(service.addEhrJob(jobData)).rejects.toThrow('Queue error');
    });

    it('should handle queue status errors', async () => {
      mockQueue.getWaiting.mockRejectedValue(new Error('Queue error'));

      await expect(service.getQueueStatus()).rejects.toThrow('Queue error');
    });

    it('should handle job status errors', async () => {
      mockQueue.getJob.mockRejectedValue(new Error('Queue error'));

      await expect(service.getJobStatus('job-123')).rejects.toThrow('Queue error');
    });
  });

  describe('EhrJobData interface', () => {
    it('should accept valid EhrJobData', () => {
      const validJobData: EhrJobData = {
        ehrName: 'Athena',
        patientData: { firstName: 'John', lastName: 'Doe' },
        transactionId: 'txn-123',
        language: 'en',
        retryCount: 1,
      };

      expect(validJobData.ehrName).toBe('Athena');
      expect(validJobData.patientData).toEqual({ firstName: 'John', lastName: 'Doe' });
      expect(validJobData.transactionId).toBe('txn-123');
      expect(validJobData.language).toBe('en');
      expect(validJobData.retryCount).toBe(1);
    });

    it('should accept minimal EhrJobData', () => {
      const minimalJobData: EhrJobData = {
        ehrName: 'Athena',
        patientData: { firstName: 'John' },
        transactionId: 'txn-123',
      };

      expect(minimalJobData.ehrName).toBe('Athena');
      expect(minimalJobData.patientData).toEqual({ firstName: 'John' });
      expect(minimalJobData.transactionId).toBe('txn-123');
    });
  });
});
