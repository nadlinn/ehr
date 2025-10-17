import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { IEhrIntegration } from '../IEhrIntegration';
import { AllscriptsMappingService } from './allscripts.mapping.service';
import { PatientDataDto } from '../dto/patient-data.dto';

@Injectable()
export class AllscriptsStrategy implements IEhrIntegration {
  private readonly logger = new Logger(AllscriptsStrategy.name);

  constructor(private readonly mappingService: AllscriptsMappingService) {}

  getEHRName(): string {
    return 'Allscripts';
  }

  async sendData(patientData: any): Promise<any> {
    try {
      this.logger.log(`Sending data to Allscripts: ${JSON.stringify(patientData)}`);
      
      // Simulate Allscripts API call with realistic response
      const response = await this.callAllscriptsApi(patientData);
      
      this.logger.log(`Allscripts response: ${JSON.stringify(response)}`);
      return {
        success: true,
        ehr: 'Allscripts',
        transactionId: response.transactionId,
        data: patientData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to send data to Allscripts: ${error.message}`);
      throw new HttpException(
        `Allscripts integration failed: ${error.message}`,
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  mapData(patientData: PatientDataDto, mappingConfig: any): any {
    return this.mappingService.applyMapping(patientData, mappingConfig);
  }

  private async callAllscriptsApi(patientData: any): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Simulate realistic Allscripts response
    return {
      transactionId: `ALLSCRIPTS-${Date.now()}`,
      status: 'success',
      patientId: `ALL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      message: 'Patient data successfully integrated with Allscripts'
    };
  }
}

