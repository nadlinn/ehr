import { Injectable } from '@nestjs/common';
import { IEhrIntegration } from '../IEhrIntegration';
import { EhrBMappingService } from './ehr-b.mapping.service';

@Injectable()
export class EhrBStrategy implements IEhrIntegration {
  constructor(private readonly mappingService: EhrBMappingService) {}

  getEHRName(): string {
    return 'EHR-B';
  }

  async sendData(patientData: any): Promise<any> {
    console.log(`Sending data to EHR-B: ${JSON.stringify(patientData)}`);
    // Simulate API call to EHR-B
    return { success: true, ehr: 'EHR-B', data: patientData };
  }

  mapData(patientData: any, mappingConfig: any): any {
    return this.mappingService.applyMapping(patientData, mappingConfig);
  }
}

