import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  // EHR-specific cache methods
  async getEhrMapping(ehrName: string): Promise<any> {
    const key = `ehr_mapping_${ehrName}`;
    return this.get(key);
  }

  async setEhrMapping(ehrName: string, mapping: any, ttl: number = 3600): Promise<void> {
    const key = `ehr_mapping_${ehrName}`;
    await this.set(key, mapping, ttl);
  }

  async invalidateEhrMapping(ehrName: string): Promise<void> {
    const key = `ehr_mapping_${ehrName}`;
    await this.del(key);
  }

  async getPatientData(patientId: string): Promise<any> {
    const key = `patient_data_${patientId}`;
    return this.get(key);
  }

  async setPatientData(patientId: string, data: any, ttl: number = 1800): Promise<void> {
    const key = `patient_data_${patientId}`;
    await this.set(key, data, ttl);
  }

  async getTransactionStatus(transactionId: string): Promise<any> {
    const key = `transaction_status_${transactionId}`;
    return this.get(key);
  }

  async setTransactionStatus(transactionId: string, status: any, ttl: number = 300): Promise<void> {
    const key = `transaction_status_${transactionId}`;
    await this.set(key, status, ttl);
  }
}
