import { Test, TestingModule } from '@nestjs/testing';
import { AthenaMappingService } from '../../../src/ehr-integrations/athena/athena.mapping.service';
import { PatientDataDto } from '../../../src/ehr-integrations/dto/patient-data.dto';

describe('AthenaMappingService', () => {
  let service: AthenaMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AthenaMappingService],
    }).compile();

    service = module.get<AthenaMappingService>(AthenaMappingService);
  });

  describe('applyMapping', () => {
    const patientData: PatientDataDto = {
      firstName: 'John',
      lastName: 'Doe',
      age: 30,
      gender: 'male',
      contact: {
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        address: '123 Main St'
      },
      allergies: ['peanuts'],
      medications: ['aspirin']
    };

    it('should apply basic field mappings', () => {
      const mappingConfig = {
        'firstName': 'PATIENT_FIRST_NAME',
        'lastName': 'PATIENT_LAST_NAME',
        'name': 'PATIENT_IDENT_NAME',
        'age': 'AGE_PATIENT',
        'contact.email': 'PATIENT_EMAIL_ID',
        'contact.phone': 'TELEPHONE_NUMBER_PATIENT',
        'contact.address': 'PATIENT_LOCATION_ADDRESS',
        'allergies': 'ALLERGIES_PATIENT'
      };

      const result = service.applyMapping(patientData, mappingConfig);

      expect(result).toEqual({
        PATIENT_FIRST_NAME: 'John',
        PATIENT_LAST_NAME: 'Doe',
        // PATIENT_IDENT_NAME is not mapped since 'name' field doesn't exist in patient data
        AGE_PATIENT: 30,
        PATIENT_EMAIL_ID: 'john.doe@example.com',
        TELEPHONE_NUMBER_PATIENT: '123-456-7890',
        PATIENT_LOCATION_ADDRESS: '123 Main St',
        ALLERGIES_PATIENT: ['peanuts'], // Array as received from mapping
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        address: '123 Main St',
        allergies: 'peanuts', // String as processed by service
        ehr_system: 'Athena',
        integration_timestamp: expect.any(String),
        data_source: 'patient_portal'
      });
    });

    it('should handle nested property mappings', () => {
      const mappingConfig = {
        'contact.phone': 'TELEPHONE_NUMBER_PATIENT',
        'allergies': 'ALLERGIES_PATIENT'
      };

      const result = service.applyMapping(patientData, mappingConfig);

      expect(result.TELEPHONE_NUMBER_PATIENT).toBe('123-456-7890');
      expect(result.ALLERGIES_PATIENT).toEqual(['peanuts']);
      expect(result.phone).toBe('123-456-7890');
      expect(result.allergies).toBe('peanuts');
      expect(result.ehr_system).toBe('Athena');
    });

    it('should apply Athena specific transformations', () => {
      const mappingConfig = {
        'firstName': 'PATIENT_FIRST_NAME',
        'lastName': 'PATIENT_LAST_NAME',
        'name': 'PATIENT_IDENT_NAME' // This will be undefined since 'name' doesn't exist in patient data
      };

      const result = service.applyMapping(patientData, mappingConfig);

      expect(result.PATIENT_FIRST_NAME).toBe('John');
      expect(result.PATIENT_LAST_NAME).toBe('Doe');
      expect(result.PATIENT_IDENT_NAME).toBeUndefined(); // 'name' field doesn't exist in patient data
      expect(result.email).toBe('john.doe@example.com');
      expect(result.phone).toBe('123-456-7890');
      expect(result.address).toBe('123 Main St');
    });

    it('should handle missing fields gracefully', () => {
      const mappingConfig = {
        'nonExistentField': 'TARGET_FIELD',
        'name': 'PATIENT_IDENT_NAME'
      };

      const result = service.applyMapping(patientData, mappingConfig);

      expect(result.PATIENT_IDENT_NAME).toBeUndefined(); // 'name' field doesn't exist in patient data
      expect(result.TARGET_FIELD).toBeUndefined();
    });

    it('should add Athena specific metadata', () => {
      const mappingConfig = {};

      const result = service.applyMapping(patientData, mappingConfig);

      expect(result.ehr_system).toBe('Athena');
      expect(result.integration_timestamp).toBeDefined();
      expect(result.data_source).toBe('patient_portal');
    });
  });

  describe('private helper methods', () => {
    it('should check nested properties correctly', () => {
      const obj = { level1: { level2: { value: 'test' } } };
      
      expect(service['hasNestedProperty'](obj, 'level1.level2.value')).toBe(true);
      expect(service['hasNestedProperty'](obj, 'level1.level2.nonexistent')).toBe(false);
      expect(service['hasNestedProperty'](obj, 'level1.nonexistent.value')).toBe(false);
    });

    it('should get nested properties correctly', () => {
      const obj = { level1: { level2: { value: 'test' } } };
      
      expect(service['getNestedProperty'](obj, 'level1.level2.value')).toBe('test');
      expect(service['getNestedProperty'](obj, 'level1.level2.nonexistent')).toBeUndefined();
    });

    it('should set nested properties correctly', () => {
      const obj = {};
      
      service['setNestedProperty'](obj, 'level1.level2.value', 'test');
      
      expect(obj).toEqual({ level1: { level2: { value: 'test' } } });
    });
  });
});
