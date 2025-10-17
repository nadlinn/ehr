import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from '../../src/i18n/i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [I18nService],
    }).compile();

    service = module.get<I18nService>(I18nService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('translate', () => {
    it('should translate English text by default', () => {
      const result = service.translate('validation.required');
      expect(result).toBe('This field is required');
    });

    it('should translate English text when language is specified', () => {
      const result = service.translate('validation.required', 'en');
      expect(result).toBe('This field is required');
    });

    it('should translate Spanish text when language is es', () => {
      const result = service.translate('validation.required', 'es');
      expect(result).toBe('Este campo es obligatorio');
    });

    it('should translate with interpolation', () => {
      const result = service.translate('errors.mappingNotFound', 'en', { ehrName: 'Athena' });
      expect(result).toBe('Mapping configuration not found for EHR: Athena');
    });

    it('should translate with interpolation in Spanish', () => {
      const result = service.translate('errors.mappingNotFound', 'es', { ehrName: 'Athena' });
      expect(result).toBe('Configuración de mapeo no encontrada para EHR: Athena');
    });

    it('should fallback to English for unsupported language', () => {
      const result = service.translate('validation.required', 'fr');
      expect(result).toBe('This field is required');
    });

    it('should return key if translation not found', () => {
      const result = service.translate('nonexistent.key');
      expect(result).toBe('nonexistent.key');
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return supported languages', () => {
      const languages = service.getSupportedLanguages();
      expect(languages).toEqual(['en', 'es']);
    });
  });

  describe('isLanguageSupported', () => {
    it('should return true for supported languages', () => {
      expect(service.isLanguageSupported('en')).toBe(true);
      expect(service.isLanguageSupported('es')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(service.isLanguageSupported('fr')).toBe(false);
      expect(service.isLanguageSupported('de')).toBe(false);
    });
  });

  describe('validation messages', () => {
    it('should translate all validation messages in English', () => {
      expect(service.translate('validation.email', 'en')).toBe('Please provide a valid email address');
      expect(service.translate('validation.phone', 'en')).toBe('Please provide a valid phone number');
      expect(service.translate('validation.age', 'en')).toBe('Age must be a number between 0 and 150');
      expect(service.translate('validation.firstName', 'en')).toBe('First name is required');
      expect(service.translate('validation.lastName', 'en')).toBe('Last name is required');
      expect(service.translate('validation.contact', 'en')).toBe('Contact information is required');
    });

    it('should translate all validation messages in Spanish', () => {
      expect(service.translate('validation.email', 'es')).toBe('Por favor proporcione una dirección de correo electrónico válida');
      expect(service.translate('validation.phone', 'es')).toBe('Por favor proporcione un número de teléfono válido');
      expect(service.translate('validation.age', 'es')).toBe('La edad debe ser un número entre 0 y 150');
      expect(service.translate('validation.firstName', 'es')).toBe('El nombre es obligatorio');
      expect(service.translate('validation.lastName', 'es')).toBe('El apellido es obligatorio');
      expect(service.translate('validation.contact', 'es')).toBe('La información de contacto es obligatoria');
    });
  });

  describe('success messages', () => {
    it('should translate success messages in English', () => {
      expect(service.translate('success.dataSent', 'en', { ehrName: 'Athena' })).toBe('Patient data successfully sent to Athena');
      expect(service.translate('success.mappingSaved', 'en')).toBe('EHR mapping configuration saved successfully');
      expect(service.translate('success.transactionRetried', 'en')).toBe('Transaction retry initiated');
    });

    it('should translate success messages in Spanish', () => {
      expect(service.translate('success.dataSent', 'es', { ehrName: 'Athena' })).toBe('Datos del paciente enviados exitosamente a Athena');
      expect(service.translate('success.mappingSaved', 'es')).toBe('Configuración de mapeo EHR guardada exitosamente');
      expect(service.translate('success.transactionRetried', 'es')).toBe('Reintento de transacción iniciado');
    });
  });

  describe('field labels', () => {
    it('should translate field labels in English', () => {
      expect(service.translate('fields.firstName', 'en')).toBe('First Name');
      expect(service.translate('fields.lastName', 'en')).toBe('Last Name');
      expect(service.translate('fields.age', 'en')).toBe('Age');
      expect(service.translate('fields.gender', 'en')).toBe('Gender');
      expect(service.translate('fields.email', 'en')).toBe('Email');
      expect(service.translate('fields.phone', 'en')).toBe('Phone');
    });

    it('should translate field labels in Spanish', () => {
      expect(service.translate('fields.firstName', 'es')).toBe('Nombre');
      expect(service.translate('fields.lastName', 'es')).toBe('Apellido');
      expect(service.translate('fields.age', 'es')).toBe('Edad');
      expect(service.translate('fields.gender', 'es')).toBe('Género');
      expect(service.translate('fields.email', 'es')).toBe('Correo Electrónico');
      expect(service.translate('fields.phone', 'es')).toBe('Teléfono');
    });
  });
});
