import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Response Types
export interface PatientData {
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  contact: {
    email: string;
    phone: string;
    address?: string;
  };
  allergies?: string[];
  medications?: string[];
  medicalHistory?: string;
  socialHistory?: string;
  familyHistory?: string;
  symptoms?: string[];
  bloodType?: string;
  maritalStatus?: string;
  emergencyContact?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  primaryCarePhysician?: string;
}

export interface SendPatientDataRequest {
  ehrName: string;
  patientData: PatientData;
  language?: string;
  targetEndpoints?: string[];
}

export interface EhrEndpoint {
  endpointName: string;
  endpointUrl: string;
  supportedFields: string[];
  description?: string;
}

export interface EndpointSubmissionResult {
  endpointName: string;
  success: boolean;
  transactionId?: string;
  error?: string;
  data?: any;
}

export interface MultiEndpointSubmissionResult {
  ehrName: string;
  overallSuccess: boolean;
  endpointResults: EndpointSubmissionResult[];
  totalEndpoints: number;
  successfulEndpoints: number;
  failedEndpoints: number;
}

export interface TransactionLog {
  id: number;
  ehrName: string;
  patientData: any;
  mappedData?: any;
  status: 'pending' | 'mapped' | 'queued' | 'success' | 'failed' | 'retrying';
  errorMessage?: string;
  ehrResponse?: string;
  retryCount: number;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendPatientDataResponse {
  success: boolean;
  ehr: string;
  transactionId: string;
  data?: any;
  timestamp?: string;
  message?: string;
  status?: string;
  estimatedProcessingTime?: string;
}

export interface EhrMapping {
  ehrName: string;
  mappingConfig: Record<string, any>;
}

export interface TransactionLog {
  id: number;
  ehrName: string;
  patientData: PatientData;
  mappedData?: any;
  status: 'pending' | 'mapped' | 'queued' | 'success' | 'failed' | 'retrying';
  transactionId?: string;
  ehrResponse?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export interface JobStatus {
  id: string;
  data: any;
  progress: number;
  state: string;
  attempts: number;
  failedReason?: string;
}

export interface BulkJobRequest {
  jobs: SendPatientDataRequest[];
}

export interface BulkJobResponse {
  success: boolean;
  message: string;
  queuedJobs: number;
  estimatedProcessingTime: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Patient Data Management
  async sendPatientData(request: SendPatientDataRequest): Promise<SendPatientDataResponse> {
    const response: AxiosResponse<SendPatientDataResponse> = await this.client.post(
      '/ehr/send-patient-data',
      request
    );
    return response.data;
  }

  async sendPatientDataAsync(request: SendPatientDataRequest): Promise<SendPatientDataResponse> {
    const response: AxiosResponse<SendPatientDataResponse> = await this.client.post(
      '/ehr/send-patient-data-async',
      request
    );
    return response.data;
  }

  async sendBulkPatientData(request: BulkJobRequest): Promise<BulkJobResponse> {
    const response: AxiosResponse<BulkJobResponse> = await this.client.post(
      '/ehr/send-bulk-patient-data',
      request
    );
    return response.data;
  }

  // EHR Mapping Management
  async getEhrMapping(ehrName: string): Promise<EhrMapping> {
    const response: AxiosResponse<EhrMapping> = await this.client.get(
      `/ehr/mapping/${ehrName}`
    );
    return response.data;
  }

  async saveEhrMapping(mapping: EhrMapping): Promise<EhrMapping> {
    const response: AxiosResponse<EhrMapping> = await this.client.post(
      '/ehr/save-mapping',
      mapping
    );
    return response.data;
  }

  // Transaction Management
  async getTransactionLogs(ehrName?: string, status?: string): Promise<TransactionLog[]> {
    const params = new URLSearchParams();
    if (ehrName) params.append('ehrName', ehrName);
    if (status) params.append('status', status);

    const response: AxiosResponse<TransactionLog[]> = await this.client.get(
      `/ehr/transactions?${params.toString()}`
    );
    return response.data;
  }

  async retryTransaction(transactionId: number): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.client.post(
      `/ehr/retry-transaction/${transactionId}`
    );
    return response.data;
  }

  // Queue Management
  async getQueueStatus(): Promise<QueueStatus> {
    const response: AxiosResponse<QueueStatus> = await this.client.get('/ehr/queue/status');
    return response.data;
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response: AxiosResponse<JobStatus> = await this.client.get(`/ehr/queue/job/${jobId}`);
    return response.data;
  }

  async retryJob(jobId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.client.post(
      `/ehr/queue/retry/${jobId}`
    );
    return response.data;
  }

  // Cache Management
  async invalidateCache(ehrName: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.client.post(
      `/ehr/cache/invalidate/${ehrName}`
    );
    return response.data;
  }

  async clearAllCaches(): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.client.post(
      '/ehr/cache/clear'
    );
    return response.data;
  }

  // Multi-Endpoint EHR Integration
  async sendPatientDataToMultipleEndpoints(request: SendPatientDataRequest & { targetEndpoints?: string[] }): Promise<MultiEndpointSubmissionResult> {
    const response: AxiosResponse<MultiEndpointSubmissionResult> = await this.client.post(
      '/ehr/multi-endpoint/send-patient-data',
      request
    );
    return response.data;
  }

  async sendPatientDataToMultipleEndpointsAsync(request: SendPatientDataRequest & { targetEndpoints?: string[] }): Promise<SendPatientDataResponse> {
    const response: AxiosResponse<SendPatientDataResponse> = await this.client.post(
      '/ehr/multi-endpoint/send-patient-data-async',
      request
    );
    return response.data;
  }

  async getEhrEndpoints(ehrName: string): Promise<EhrEndpoint[]> {
    const response: AxiosResponse<EhrEndpoint[]> = await this.client.get(
      `/ehr/multi-endpoint/endpoints/${ehrName}`
    );
    return response.data;
  }

  async getEndpointFieldMappings(ehrName: string, endpointName: string): Promise<Record<string, string>> {
    const response: AxiosResponse<Record<string, string>> = await this.client.get(
      `/ehr/multi-endpoint/endpoints/${ehrName}/${endpointName}/mappings`
    );
    return response.data;
  }

  async getMultiEndpointQueueStatus(): Promise<QueueStatus> {
    const response: AxiosResponse<QueueStatus> = await this.client.get('/ehr/multi-endpoint/queue/status');
    return response.data;
  }

  // Transaction Management
  async getTransactionLogs(ehrName?: string, status?: string): Promise<TransactionLog[]> {
    const params = new URLSearchParams();
    if (ehrName) params.append('ehrName', ehrName);
    if (status) params.append('status', status);
    
    const response: AxiosResponse<TransactionLog[]> = await this.client.get(
      `/ehr/multi-endpoint/transactions?${params.toString()}`
    );
    return response.data;
  }

  async retryTransaction(transactionId: number): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.client.post(
      `/ehr/multi-endpoint/transactions/${transactionId}/retry`
    );
    return response.data;
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response: AxiosResponse<{ status: string; timestamp: string }> = await this.client.get('/');
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
