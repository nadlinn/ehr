import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueueJob } from './entities/queue-job.entity';

export interface EhrJobData {
  ehrName: string;
  patientData: any;
  transactionId: string;
  language?: string;
  retryCount?: number;
  multiEndpoint?: boolean;
}

export interface QueueJobData {
  id: number;
  jobType: string;
  jobData: EhrJobData;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  errorMessage?: string;
  result?: any;
}

@Injectable()
export class PostgresQueueService {
  private readonly logger = new Logger(PostgresQueueService.name);

  constructor(
    @InjectRepository(QueueJob)
    private queueJobRepository: Repository<QueueJob>,
  ) {}

  /**
   * Add a job to the PostgreSQL queue
   */
  async addEhrJob(data: EhrJobData): Promise<QueueJob> {
    const job = this.queueJobRepository.create({
      jobType: 'process-ehr',
      jobData: data,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
    });

    const savedJob = await this.queueJobRepository.save(job);
    this.logger.log(`Job ${savedJob.id} added to queue for ${data.ehrName}`);
    
    return savedJob;
  }

  /**
   * Add multiple jobs to the queue
   */
  async addBulkEhrJobs(jobs: EhrJobData[]): Promise<QueueJob[]> {
    const jobEntities = jobs.map(data => 
      this.queueJobRepository.create({
        jobType: 'process-ehr',
        jobData: data,
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
      })
    );

    const savedJobs = await this.queueJobRepository.save(jobEntities);
    this.logger.log(`${savedJobs.length} jobs added to queue`);
    
    return savedJobs;
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<any> {
    const [pending, processing, completed, failed] = await Promise.all([
      this.queueJobRepository.count({ where: { status: 'pending' } }),
      this.queueJobRepository.count({ where: { status: 'processing' } }),
      this.queueJobRepository.count({ where: { status: 'completed' } }),
      this.queueJobRepository.count({ where: { status: 'failed' } }),
    ]);

    return {
      pending,
      processing,
      completed,
      failed,
      total: pending + processing + completed + failed,
    };
  }

  /**
   * Get job status by ID
   */
  async getJobStatus(jobId: number): Promise<QueueJob | null> {
    return this.queueJobRepository.findOne({ where: { id: jobId } });
  }

  /**
   * Retry a failed job
   */
  async retryFailedJob(jobId: number): Promise<boolean> {
    const job = await this.queueJobRepository.findOne({ where: { id: jobId } });
    if (!job || job.status !== 'failed') {
      return false;
    }

    job.status = 'pending';
    job.attempts = 0;
    job.errorMessage = undefined;
    await this.queueJobRepository.save(job);
    
    this.logger.log(`Job ${jobId} retried`);
    return true;
  }

  /**
   * Clean old completed jobs
   */
  async cleanQueue(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Keep jobs for 7 days

    const result = await this.queueJobRepository
      .createQueryBuilder()
      .delete()
      .where('status = :status AND createdAt < :cutoffDate', {
        status: 'completed',
        cutoffDate,
      })
      .execute();

    this.logger.log(`Cleaned ${result.affected} old completed jobs`);
    return result.affected || 0;
  }

  /**
   * Get pending jobs for processing
   */
  async getPendingJobs(limit: number = 10): Promise<QueueJob[]> {
    return this.queueJobRepository.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * Mark job as processing
   */
  async markJobProcessing(jobId: number): Promise<void> {
    await this.queueJobRepository.update(jobId, {
      status: 'processing',
      updatedAt: new Date(),
    });
  }

  /**
   * Mark job as completed
   */
  async markJobCompleted(jobId: number, result: any): Promise<void> {
    await this.queueJobRepository.update(jobId, {
      status: 'completed',
      result,
      processedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Mark job as failed
   */
  async markJobFailed(jobId: number, errorMessage: string): Promise<void> {
    const job = await this.queueJobRepository.findOne({ where: { id: jobId } });
    if (!job) return;

    const newAttempts = job.attempts + 1;
    const shouldRetry = newAttempts < job.maxAttempts;

    await this.queueJobRepository.update(jobId, {
      status: shouldRetry ? 'pending' : 'failed',
      attempts: newAttempts,
      errorMessage,
      updatedAt: new Date(),
    });

    if (shouldRetry) {
      this.logger.log(`Job ${jobId} will be retried (attempt ${newAttempts}/${job.maxAttempts})`);
    } else {
      this.logger.error(`Job ${jobId} failed permanently after ${newAttempts} attempts`);
    }
  }

  /**
   * Process jobs (called by cron job)
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async processJobs(): Promise<void> {
    const pendingJobs = await this.getPendingJobs(5);
    
    if (pendingJobs.length === 0) {
      return;
    }

    this.logger.log(`Processing ${pendingJobs.length} jobs`);

    for (const job of pendingJobs) {
      await this.processJob(job);
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: QueueJob): Promise<void> {
    try {
      await this.markJobProcessing(job.id);
      
      // Simulate job processing
      await this.simulateJobProcessing(job);
      
      await this.markJobCompleted(job.id, {
        success: true,
        processedAt: new Date().toISOString(),
        ehrName: job.jobData.ehrName,
        transactionId: job.jobData.transactionId,
      });

      this.logger.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      await this.markJobFailed(job.id, error.message);
      this.logger.error(`Job ${job.id} failed: ${error.message}`);
    }
  }

  /**
   * Simulate job processing (replace with actual EHR integration)
   */
  private async simulateJobProcessing(job: QueueJob): Promise<void> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error('Simulated processing failure');
    }
  }
}
