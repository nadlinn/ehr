import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { IEhrIntegration } from '../IEhrIntegration';
import { AthenaMappingService } from './athena.mapping.service';
import { PatientDataDto } from '../dto/patient-data.dto';

@Injectable()
export class AthenaStrategy implements IEhrIntegration {
  private readonly logger = new Logger(AthenaStrategy.name);

  constructor(private readonly mappingService: AthenaMappingService) {}

  getEHRName(): string {
    return 'Athena';
  }

  async sendData(patientData: any): Promise<any> {
    try {
      this.logger.log(`Sending data to Athena: ${JSON.stringify(patientData)}`);
      
      // Simulate Athena API call with realistic response
      const response = await this.callAthenaApi(patientData);
      
      this.logger.log(`Athena response: ${JSON.stringify(response)}`);
      return {
        success: true,
        ehr: 'Athena',
        transactionId: response.transactionId,
        data: patientData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to send data to Athena: ${error.message}`);
      throw new HttpException(
        `Athena integration failed: ${error.message}`,
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  mapData(patientData: PatientDataDto, mappingConfig: any): any {
    return this.mappingService.applyMapping(patientData, mappingConfig);
  }

  private async callAthenaApi(patientData: any): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate realistic Athena response
    return {
      transactionId: `ATHENA-${Date.now()}`,
      status: 'success',
      patientId: `ATH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      message: 'Patient data successfully integrated with Athena'
    };
  }
}
