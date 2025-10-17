import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English translations
const en = {
  translation: {
    // Navigation
    nav: {
      home: 'Home',
      patientData: 'Patient Data',
      mappings: 'EHR Mappings',
      transactions: 'Transactions',
      queue: 'Queue Monitor',
      settings: 'Settings',
    },
    
    // Common
    common: {
      submit: 'Submit',
      cancel: 'Cancel',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      retry: 'Retry',
      refresh: 'Refresh',
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information',
      confirm: 'Confirm',
      close: 'Close',
    },

    // Patient Data Form
    patientForm: {
      title: 'Patient Data Submission',
      description: 'Submit patient information to EHR systems',
      firstName: 'First Name',
      lastName: 'Last Name',
      age: 'Age',
      gender: 'Gender',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      allergies: 'Allergies',
      medications: 'Current Medications',
      medicalHistory: 'Medical History',
      symptoms: 'Current Symptoms',
      selectEhr: 'Select EHR System',
      selectEhrPlaceholder: 'Choose an EHR system',
      processingMode: 'Processing Mode',
      synchronous: 'Synchronous (Immediate)',
      asynchronous: 'Asynchronous (Background)',
      bulk: 'Bulk Processing',
      language: 'Language',
      submitData: 'Submit Patient Data',
      submitting: 'Submitting...',
    },

    // EHR Systems
    ehrSystems: {
      athena: 'Athena',
      allscripts: 'Allscripts',
      epic: 'Epic',
      cerner: 'Cerner',
    },

    // Genders
    genders: {
      male: 'Male',
      female: 'Female',
      other: 'Other',
      preferNotToSay: 'Prefer not to say',
    },

    // Validation Messages
    validation: {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      phone: 'Please enter a valid phone number',
      age: 'Age must be between 0 and 150',
      minLength: 'Must be at least {{min}} characters',
      maxLength: 'Must be no more than {{max}} characters',
      invalidFormat: 'Invalid format',
    },

    // Success Messages
    success: {
      dataSent: 'Patient data successfully sent to {{ehrName}}',
      dataQueued: 'Patient data queued for processing',
      mappingSaved: 'EHR mapping configuration saved successfully',
      cacheCleared: 'Cache cleared successfully',
      transactionRetried: 'Transaction retry initiated',
    },

    // Error Messages
    errors: {
      networkError: 'Network error. Please check your connection.',
      serverError: 'Server error. Please try again later.',
      validationError: 'Please check your input and try again.',
      ehrNotFound: 'EHR system not found',
      mappingNotFound: 'Mapping configuration not found',
      transactionFailed: 'Transaction failed',
      retryExceeded: 'Maximum retry attempts exceeded',
      unknownError: 'An unknown error occurred',
    },

    // Transaction Status
    transactionStatus: {
      pending: 'Pending',
      mapped: 'Mapped',
      queued: 'Queued',
      success: 'Success',
      failed: 'Failed',
      retrying: 'Retrying',
    },

    // Queue Status
    queueStatus: {
      title: 'Queue Status',
      waiting: 'Waiting',
      active: 'Active',
      completed: 'Completed',
      failed: 'Failed',
      total: 'Total Jobs',
    },

    // Mapping Management
    mappingManagement: {
      title: 'EHR Mapping Management',
      description: 'Configure data mappings for different EHR systems',
      ehrName: 'EHR System',
      mappingConfig: 'Mapping Configuration',
      fieldMapping: 'Field Mapping',
      sourceField: 'Source Field',
      targetField: 'Target Field',
      addMapping: 'Add Mapping',
      removeMapping: 'Remove Mapping',
      saveMapping: 'Save Mapping',
      testMapping: 'Test Mapping',
    },

    // Transaction Management
    transactionManagement: {
      title: 'Transaction Management',
      description: 'Monitor and manage EHR data transmissions',
      transactionId: 'Transaction ID',
      ehrName: 'EHR System',
      status: 'Status',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      retryCount: 'Retry Count',
      errorMessage: 'Error Message',
      actions: 'Actions',
      viewDetails: 'View Details',
      retryTransaction: 'Retry Transaction',
      filterByEhr: 'Filter by EHR',
      filterByStatus: 'Filter by Status',
      allEhrs: 'All EHRs',
      allStatuses: 'All Statuses',
    },

    // Settings
    settings: {
      title: 'Settings',
      language: 'Language',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      apiUrl: 'API URL',
      cacheSettings: 'Cache Settings',
      clearCache: 'Clear All Caches',
      invalidateCache: 'Invalidate Cache',
    },

    // Dashboard
    dashboard: {
      title: 'EHR Integration Dashboard',
      description: 'Monitor and manage EHR integrations',
      totalTransactions: 'Total Transactions',
      successRate: 'Success Rate',
      averageProcessingTime: 'Average Processing Time',
      activeQueues: 'Active Queues',
      recentTransactions: 'Recent Transactions',
      systemHealth: 'System Health',
    },
  },
};

// Spanish translations
const es = {
  translation: {
    // Navigation
    nav: {
      home: 'Inicio',
      patientData: 'Datos del Paciente',
      mappings: 'Mapeos EHR',
      transactions: 'Transacciones',
      queue: 'Monitor de Cola',
      settings: 'Configuración',
    },
    
    // Common
    common: {
      submit: 'Enviar',
      cancel: 'Cancelar',
      save: 'Guardar',
      edit: 'Editar',
      delete: 'Eliminar',
      retry: 'Reintentar',
      refresh: 'Actualizar',
      loading: 'Cargando...',
      success: 'Éxito',
      error: 'Error',
      warning: 'Advertencia',
      info: 'Información',
      confirm: 'Confirmar',
      close: 'Cerrar',
    },

    // Patient Data Form
    patientForm: {
      title: 'Envío de Datos del Paciente',
      description: 'Enviar información del paciente a sistemas EHR',
      firstName: 'Nombre',
      lastName: 'Apellido',
      age: 'Edad',
      gender: 'Género',
      email: 'Correo Electrónico',
      phone: 'Teléfono',
      address: 'Dirección',
      allergies: 'Alergias',
      medications: 'Medicamentos Actuales',
      medicalHistory: 'Historial Médico',
      symptoms: 'Síntomas Actuales',
      selectEhr: 'Seleccionar Sistema EHR',
      selectEhrPlaceholder: 'Elegir un sistema EHR',
      processingMode: 'Modo de Procesamiento',
      synchronous: 'Síncrono (Inmediato)',
      asynchronous: 'Asíncrono (En segundo plano)',
      bulk: 'Procesamiento en Lote',
      language: 'Idioma',
      submitData: 'Enviar Datos del Paciente',
      submitting: 'Enviando...',
    },

    // EHR Systems
    ehrSystems: {
      athena: 'Athena',
      allscripts: 'Allscripts',
      epic: 'Epic',
      cerner: 'Cerner',
    },

    // Genders
    genders: {
      male: 'Masculino',
      female: 'Femenino',
      other: 'Otro',
      preferNotToSay: 'Prefiero no decir',
    },

    // Validation Messages
    validation: {
      required: 'Este campo es obligatorio',
      email: 'Por favor ingrese un correo electrónico válido',
      phone: 'Por favor ingrese un número de teléfono válido',
      age: 'La edad debe estar entre 0 y 150',
      minLength: 'Debe tener al menos {{min}} caracteres',
      maxLength: 'No debe tener más de {{max}} caracteres',
      invalidFormat: 'Formato inválido',
    },

    // Success Messages
    success: {
      dataSent: 'Datos del paciente enviados exitosamente a {{ehrName}}',
      dataQueued: 'Datos del paciente en cola para procesamiento',
      mappingSaved: 'Configuración de mapeo EHR guardada exitosamente',
      cacheCleared: 'Caché limpiado exitosamente',
      transactionRetried: 'Reintento de transacción iniciado',
    },

    // Error Messages
    errors: {
      networkError: 'Error de red. Por favor verifique su conexión.',
      serverError: 'Error del servidor. Por favor intente más tarde.',
      validationError: 'Por favor verifique su entrada e intente nuevamente.',
      ehrNotFound: 'Sistema EHR no encontrado',
      mappingNotFound: 'Configuración de mapeo no encontrada',
      transactionFailed: 'Transacción falló',
      retryExceeded: 'Se excedió el número máximo de reintentos',
      unknownError: 'Ocurrió un error desconocido',
    },

    // Transaction Status
    transactionStatus: {
      pending: 'Pendiente',
      mapped: 'Mapeado',
      queued: 'En Cola',
      success: 'Éxito',
      failed: 'Falló',
      retrying: 'Reintentando',
    },

    // Queue Status
    queueStatus: {
      title: 'Estado de la Cola',
      waiting: 'Esperando',
      active: 'Activo',
      completed: 'Completado',
      failed: 'Falló',
      total: 'Total de Trabajos',
    },

    // Mapping Management
    mappingManagement: {
      title: 'Gestión de Mapeos EHR',
      description: 'Configurar mapeos de datos para diferentes sistemas EHR',
      ehrName: 'Sistema EHR',
      mappingConfig: 'Configuración de Mapeo',
      fieldMapping: 'Mapeo de Campos',
      sourceField: 'Campo Origen',
      targetField: 'Campo Destino',
      addMapping: 'Agregar Mapeo',
      removeMapping: 'Eliminar Mapeo',
      saveMapping: 'Guardar Mapeo',
      testMapping: 'Probar Mapeo',
    },

    // Transaction Management
    transactionManagement: {
      title: 'Gestión de Transacciones',
      description: 'Monitorear y gestionar transmisiones de datos EHR',
      transactionId: 'ID de Transacción',
      ehrName: 'Sistema EHR',
      status: 'Estado',
      createdAt: 'Creado En',
      updatedAt: 'Actualizado En',
      retryCount: 'Conteo de Reintentos',
      errorMessage: 'Mensaje de Error',
      actions: 'Acciones',
      viewDetails: 'Ver Detalles',
      retryTransaction: 'Reintentar Transacción',
      filterByEhr: 'Filtrar por EHR',
      filterByStatus: 'Filtrar por Estado',
      allEhrs: 'Todos los EHRs',
      allStatuses: 'Todos los Estados',
    },

    // Settings
    settings: {
      title: 'Configuración',
      language: 'Idioma',
      theme: 'Tema',
      light: 'Claro',
      dark: 'Oscuro',
      system: 'Sistema',
      apiUrl: 'URL de API',
      cacheSettings: 'Configuración de Caché',
      clearCache: 'Limpiar Todas las Cachés',
      invalidateCache: 'Invalidar Caché',
    },

    // Dashboard
    dashboard: {
      title: 'Panel de Integración EHR',
      description: 'Monitorear y gestionar integraciones EHR',
      totalTransactions: 'Total de Transacciones',
      successRate: 'Tasa de Éxito',
      averageProcessingTime: 'Tiempo Promedio de Procesamiento',
      activeQueues: 'Colas Activas',
      recentTransactions: 'Transacciones Recientes',
      systemHealth: 'Salud del Sistema',
    },
  },
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en,
      es,
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
