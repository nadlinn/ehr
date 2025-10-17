import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EhrIntegrationService } from '../ehr-integrations/ehr-integration.service';
import { EhrJobData } from './queue.service';

@Processor('ehr-processing')
export class EhrQueueProcessor {
  private readonly logger = new Logger(EhrQueueProcessor.name);

  constructor(
    private readonly ehrIntegrationService: EhrIntegrationService,
  ) {}

  @Process('process-ehr')
  async handleEhrProcessing(job: Job<EhrJobData>) {
    const { ehrName, patientData, transactionId, language = 'en' } = job.data;
    
    this.logger.log(`Processing EHR job for ${ehrName} (Transaction: ${transactionId})`);
    
    try {
      // Update job progress
      await job.progress(25);
      
      // Send data to EHR system
      const result = await this.ehrIntegrationService.sendPatientData(ehrName, patientData);
      
      await job.progress(75);
      
      // Log success
      this.logger.log(`Successfully processed EHR job for ${ehrName} (Transaction: ${transactionId})`);
      
      await job.progress(100);
      
      return {
        success: true,
        transactionId,
        ehrName,
        result,
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to process EHR job for ${ehrName}: ${error.message}`);
      
      // Log error - updateTransactionStatus method doesn't exist in the service
      this.logger.error(`Transaction ${transactionId} failed: ${error.message}`);
      
      throw error;
    }
  }

  @Process('bulk-ehr-processing')
  async handleBulkEhrProcessing(job: Job<EhrJobData[]>) {
    const jobs = job.data;
    this.logger.log(`Processing bulk EHR jobs: ${jobs.length} jobs`);
    
    const results = [];
    
    for (let i = 0; i < jobs.length; i++) {
      const jobData = jobs[i];
      try {
        const result = await this.handleEhrProcessing({
          data: jobData,
          progress: () => Promise.resolve(),
          attemptsMade: 0,
          id: `${job.id}-${i}`,
        } as Job<EhrJobData>);
        
        results.push({ success: true, transactionId: result.transactionId, ehrName: result.ehrName, result: result.result, processedAt: result.processedAt });
        await job.progress((i + 1) / jobs.length * 100);
      } catch (error) {
        results.push({ 
          success: false, 
          ehrName: jobData.ehrName, 
          error: error.message 
        });
      }
    }
    
    return {
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }
}
