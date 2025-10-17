import { Injectable, Logger } from '@nestjs/common';
import { PatientDataDto } from '../dto/patient-data.dto';

@Injectable()
export class AllscriptsMappingService {
  private readonly logger = new Logger(AllscriptsMappingService.name);

  applyMapping(patientData: PatientDataDto, mappingConfig: any): any {
    this.logger.log(`Applying Allscripts mapping: ${JSON.stringify(mappingConfig)}`);
    
    const mappedData: any = {};
    
    // Apply field mappings from the JSON configuration
    for (const [sourceField, targetField] of Object.entries(mappingConfig)) {
      if (this.hasNestedProperty(patientData, sourceField)) {
        const value = this.getNestedProperty(patientData, sourceField);
        this.setNestedProperty(mappedData, targetField as string, value);
      }
    }

    // Allscripts-specific transformations (prefixed fields)
    if (mappedData.p_name) {
      mappedData.p_name = `${patientData.firstName} ${patientData.lastName}`;
    }

    // Handle contact information for Allscripts
    if (patientData.contact) {
      if (patientData.contact.email) {
        mappedData.p_email = patientData.contact.email;
      }
      if (patientData.contact.phone) {
        mappedData.p_phone = patientData.contact.phone;
      }
      if (patientData.contact.address) {
        mappedData.p_address = patientData.contact.address;
      }
    }

    // Handle allergies array for Allscripts
    if (patientData.allergies && Array.isArray(patientData.allergies)) {
      mappedData.p_allergies = patientData.allergies.join(', ');
    }

    // Handle medical history for Allscripts
    if (patientData.medicalHistory) {
      mappedData.p_medicalHistory = JSON.stringify(patientData.medicalHistory);
    }

    // Add Allscripts-specific metadata
    mappedData.system = 'Allscripts';
    mappedData.created_at = new Date().toISOString();
    mappedData.source = 'patient_portal';

    this.logger.log(`Allscripts mapped data: ${JSON.stringify(mappedData)}`);
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