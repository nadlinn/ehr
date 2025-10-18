import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

export interface EhrJobData {
  ehrName: string;
  patientData: any;
  transactionId: string;
  language?: string;
  retryCount?: number;
  multiEndpoint?: boolean;
}

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('ehr-processing') private ehrQueue: Queue,
  ) {}

  async addEhrJob(data: EhrJobData): Promise<any> {
    const job = await this.ehrQueue.add('process-ehr', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    });
    return job;
  }

  async addBulkEhrJobs(jobs: EhrJobData[]): Promise<void> {
    const jobPromises = jobs.map(job => this.addEhrJob(job));
    await Promise.all(jobPromises);
  }

  async getQueueStatus(): Promise<any> {
    const waiting = await this.ehrQueue.getWaiting();
    const active = await this.ehrQueue.getActive();
    const completed = await this.ehrQueue.getCompleted();
    const failed = await this.ehrQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.ehrQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      data: job.data,
      progress: job.progress(),
      state: await job.getState(),
      attempts: job.attemptsMade,
      failedReason: job.failedReason,
    };
  }

  async retryFailedJob(jobId: string): Promise<void> {
    const job = await this.ehrQueue.getJob(jobId);
    if (job) {
      await job.retry();
    }
  }

  async cleanQueue(): Promise<void> {
    await this.ehrQueue.clean(24 * 60 * 60 * 1000); // Clean jobs older than 24 hours
  }
}
