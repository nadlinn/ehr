import { Injectable } from '@nestjs/common';

@Injectable()
export class EhrAMappingService {
  applyMapping(patientData: any, mappingConfig: any): any {
    const mappedData: any = {};
    for (const key in mappingConfig) {
      if (patientData[key]) {
        mappedData[mappingConfig[key]] = patientData[key];
      }
    }
    return mappedData;
  }
}
