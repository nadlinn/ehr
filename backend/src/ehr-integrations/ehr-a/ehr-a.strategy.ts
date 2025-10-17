import { Injectable } from '@nestjs/common';
import { IEhrIntegration } from '../IEhrIntegration';
import { EhrAMappingService } from './ehr-a.mapping.service';

@Injectable()
export class EhrAStrategy implements IEhrIntegration {
  constructor(private readonly mappingService: EhrAMappingService) {}

  getEHRName(): string {
    return 'EHR-A';
  }

  async sendData(patientData: any): Promise<any> {
    console.log(`Sending data to EHR-A: ${JSON.stringify(patientData)}`);
    // Simulate API call to EHR-A
    return { success: true, ehr: 'EHR-A', data: patientData };
  }

  mapData(patientData: any, mappingConfig: any): any {
    return this.mappingService.applyMapping(patientData, mappingConfig);
  }
}
