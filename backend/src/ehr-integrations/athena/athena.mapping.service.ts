import { Injectable, Logger } from '@nestjs/common';
import { PatientDataDto } from '../dto/patient-data.dto';

@Injectable()
export class AthenaMappingService {
  private readonly logger = new Logger(AthenaMappingService.name);

  applyMapping(patientData: PatientDataDto, mappingConfig: any): any {
    this.logger.log(`Applying Athena mapping: ${JSON.stringify(mappingConfig)}`);
    
    const mappedData: any = {};
    
    // Apply field mappings from the JSON configuration
    for (const [sourceField, targetField] of Object.entries(mappingConfig)) {
      if (this.hasNestedProperty(patientData, sourceField)) {
        const value = this.getNestedProperty(patientData, sourceField);
        this.setNestedProperty(mappedData, targetField as string, value);
      }
    }

    // Athena-specific transformations - combine first and last name if name field is mapped
    for (const [key, value] of Object.entries(mappedData)) {
      if (key.includes('IDENT_NAME') || key.includes('NAME') && !key.includes('FIRST') && !key.includes('LAST')) {
        mappedData[key] = `${patientData.firstName} ${patientData.lastName}`;
      }
    }

    // Handle contact information for Athena
    if (patientData.contact) {
      if (patientData.contact.email) {
        mappedData.email = patientData.contact.email;
      }
      if (patientData.contact.phone) {
        mappedData.phone = patientData.contact.phone;
      }
      if (patientData.contact.address) {
        mappedData.address = patientData.contact.address;
      }
    }

    // Handle allergies array for Athena
    if (patientData.allergies && Array.isArray(patientData.allergies)) {
      mappedData.allergies = patientData.allergies.join(', ');
    }

    // Handle medical history for Athena
    if (patientData.medicalHistory) {
      mappedData.medicalHistory = JSON.stringify(patientData.medicalHistory);
    }

    // Add Athena-specific metadata
    mappedData.ehr_system = 'Athena';
    mappedData.integration_timestamp = new Date().toISOString();
    mappedData.data_source = 'patient_portal';

    this.logger.log(`Athena mapped data: ${JSON.stringify(mappedData)}`);
    return mappedData;
  }

  private hasNestedProperty(obj: any, path: string): boolean {
    try {
      const result = path.split('.').reduce((current, key) => {
        if (current === null || current === undefined) return null;
        return current[key];
      }, obj);
      return result !== undefined && result !== null;
    } catch {
      return false;
    }
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key];
    }, obj);
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();
    if (!lastKey) return;
    
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}
