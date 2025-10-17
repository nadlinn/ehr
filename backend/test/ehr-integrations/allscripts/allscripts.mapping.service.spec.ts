import { Test, TestingModule } from '@nestjs/testing';
import { AllscriptsMappingService } from '../../../src/ehr-integrations/allscripts/allscripts.mapping.service';
import { PatientDataDto } from '../../../src/ehr-integrations/dto/patient-data.dto';

describe('AllscriptsMappingService', () => {
  let service: AllscriptsMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AllscriptsMappingService],
    }).compile();

    service = module.get<AllscriptsMappingService>(AllscriptsMappingService);
  });

  describe('applyMapping', () => {
    const patientData: PatientDataDto = {
      firstName: 'John',
      lastName: 'Doe',
      age: 30,
      gender: 'male',
      contact: {
        email: 'john.doe@example.com',
        phone: '555-123-4567',
        address: '123 Main St'
      },
      allergies: ['Penicillin', 'Shellfish'],
      medicalHistory: {
        diabetes: 'Type 2',
        hypertension: 'Controlled'
      }
    };

    const mappingConfig = {
      firstName: 'FIRST_NAME_PAT',
      lastName: 'LAST_NAME_PAT',
      p_name: 'NAME_OF_PAT',
      p_gender: 'GENDER_PAT',
      p_age: 'AGE_PAT',
      'contact.email': 'EMAIL_ID_PAT',
      'contact.phone': 'PHONE_NUMBER_PAT',
      'contact.address': 'ADDRESS_PAT',
      allergies: 'ALLERGIES_PAT',
      medicalHistory: 'HISTORY_MEDICAL_PAT'
    };

    it('should apply basic field mappings', () => {
      const result = service.applyMapping(patientData, mappingConfig);

      expect(result).toEqual({
        FIRST_NAME_PAT: 'John',
        LAST_NAME_PAT: 'Doe',
        EMAIL_ID_PAT: 'john.doe@example.com',
        PHONE_NUMBER_PAT: '555-123-4567',
        ADDRESS_PAT: '123 Main St',
        ALLERGIES_PAT: ['Penicillin', 'Shellfish'], // Array as received from mapping
        HISTORY_MEDICAL_PAT: {
          diabetes: 'Type 2',
          hypertension: 'Controlled'
        }, // Object as received from mapping
        p_email: 'john.doe@example.com',
        p_phone: '555-123-4567',
        p_address: '123 Main St',
        p_allergies: 'Penicillin, Shellfish', // String as processed by service
        p_medicalHistory: '{"diabetes":"Type 2","hypertension":"Controlled"}', // String as processed by service
        system: 'Allscripts',
        created_at: expect.any(String),
        source: 'patient_portal'
      });
    });

    it('should handle nested property mappings', () => {
      const nestedMappingConfig = {
        'contact.email': 'EMAIL_ID_PAT',
        'contact.phone': 'PHONE_NUMBER_PAT',
        'contact.address': 'ADDRESS_PAT'
      };

      const result = service.applyMapping(patientData, nestedMappingConfig);

      expect(result.EMAIL_ID_PAT).toBe('john.doe@example.com');
      expect(result.PHONE_NUMBER_PAT).toBe('555-123-4567');
      expect(result.ADDRESS_PAT).toBe('123 Main St');
    });

    it('should handle missing nested properties gracefully', () => {
      const patientDataWithoutContact = {
        ...patientData,
        contact: undefined
      };

      const result = service.applyMapping(patientDataWithoutContact, mappingConfig);

      expect(result.FIRST_NAME_PAT).toBe('John');
      expect(result.LAST_NAME_PAT).toBe('Doe');
      expect(result.EMAIL_ID_PAT).toBeUndefined();
    });
  });
});
