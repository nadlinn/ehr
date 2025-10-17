import { Injectable } from '@nestjs/common';
// Simple i18n implementation without external dependencies
const translations: Record<string, Record<string, string>> = {
  en: {
    // Error messages
    'errors.ehrNotFound': 'EHR system not found',
    'errors.mappingConfigRequired': 'Mapping configuration is required',
    'errors.mappingNotFound': 'Mapping configuration not found for EHR: {{ehrName}}',
    'errors.queueError': 'Queue operation failed',
    'errors.transactionNotFound': 'Transaction not found',
    'errors.transactionNotFailed': 'Only failed transactions can be retried',
    'errors.ehrApiError': 'EHR API error',
    
    // Success messages
    'success.patientDataSent': 'Patient data successfully sent',
    'success.dataSent': 'Patient data successfully sent to {{ehrName}}',
    'success.patientDataSentAsync': 'Patient data queued for processing',
    'success.bulkPatientDataSent': 'Bulk patient data queued for processing',
    'success.mappingSaved': 'EHR mapping configuration saved successfully',
    'success.transactionRetried': 'Transaction retry initiated',
    
    // Validation messages
    'validation.required': 'This field is required',
    'validation.email': 'Please provide a valid email address',
    'validation.phone': 'Please provide a valid phone number',
    'validation.age': 'Age must be a number between 0 and 150',
    'validation.firstName': 'First name is required',
    'validation.lastName': 'Last name is required',
    'validation.contact': 'Contact information is required',
    
    // Field labels
    'fields.firstName': 'First Name',
    'fields.lastName': 'Last Name',
    'fields.age': 'Age',
    'fields.gender': 'Gender',
    'fields.email': 'Email',
    'fields.phone': 'Phone',
  },
  es: {
    // Error messages
    'errors.ehrNotFound': 'Sistema EHR no encontrado',
    'errors.mappingConfigRequired': 'Se requiere configuración de mapeo',
    'errors.mappingNotFound': 'Configuración de mapeo no encontrada para EHR: {{ehrName}}',
    'errors.queueError': 'Operación de cola falló',
    'errors.transactionNotFound': 'Transacción no encontrada',
    'errors.transactionNotFailed': 'Solo las transacciones fallidas pueden ser reintentadas',
    'errors.ehrApiError': 'Error de API EHR',
    
    // Success messages
    'success.patientDataSent': 'Datos del paciente enviados exitosamente',
    'success.dataSent': 'Datos del paciente enviados exitosamente a {{ehrName}}',
    'success.patientDataSentAsync': 'Datos del paciente en cola para procesamiento',
    'success.bulkPatientDataSent': 'Datos de pacientes en masa en cola para procesamiento',
    'success.mappingSaved': 'Configuración de mapeo EHR guardada exitosamente',
    'success.transactionRetried': 'Reintento de transacción iniciado',
    
    // Validation messages
    'validation.required': 'Este campo es obligatorio',
    'validation.email': 'Por favor proporcione una dirección de correo electrónico válida',
    'validation.phone': 'Por favor proporcione un número de teléfono válido',
    'validation.age': 'La edad debe ser un número entre 0 y 150',
    'validation.firstName': 'El nombre es obligatorio',
    'validation.lastName': 'El apellido es obligatorio',
    'validation.contact': 'La información de contacto es obligatoria',
    
    // Field labels
    'fields.firstName': 'Nombre',
    'fields.lastName': 'Apellido',
    'fields.age': 'Edad',
    'fields.gender': 'Género',
    'fields.email': 'Correo Electrónico',
    'fields.phone': 'Teléfono',
  },
};

@Injectable()
export class I18nService {
  translate(key: string, language: string = 'en', options?: any): string {
    const lang = language in translations ? language : 'en';
    const translation = translations[lang][key] || translations['en'][key] || key;
    
    // Simple interpolation
    if (options) {
      return translation.replace(/\{\{(\w+)\}\}/g, (match: string, prop: string) => options[prop] || match);
    }
    return translation;
  }

  getSupportedLanguages(): string[] {
    return ['en', 'es'];
  }

  isLanguageSupported(language: string): boolean {
    return this.getSupportedLanguages().includes(language);
  }
}
