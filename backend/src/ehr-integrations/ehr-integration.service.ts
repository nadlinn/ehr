import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EhrMapping } from './ehr-mapping.entity';
import { IEhrIntegration } from './IEhrIntegration';
import { EhrAStrategy } from './ehr-a/ehr-a.strategy';
import { EhrBStrategy } from './ehr-b/ehr-b.strategy';

@Injectable()
export class EhrIntegrationService {
  private readonly strategies: Map<string, IEhrIntegration>;

  constructor(
    private readonly ehrAStrategy: EhrAStrategy,
    private readonly ehrBStrategy: EhrBStrategy,
    @InjectRepository(EhrMapping)
    private ehrMappingRepository: Repository<EhrMapping>,
  ) {
    this.strategies = new Map<string, IEhrIntegration>();
    this.strategies.set(ehrAStrategy.getEHRName(), ehrAStrategy);
    this.strategies.set(ehrBStrategy.getEHRName(), ehrBStrategy);
  }

  getStrategy(ehrName: string): IEhrIntegration {
    const strategy = this.strategies.get(ehrName);
    if (!strategy) {
      throw new InternalServerErrorException(`EHR integration strategy not found for ${ehrName}`);
    }
    return strategy;
  }

  async sendPatientData(ehrName: string, patientData: any): Promise<any> {
    const ehrMapping = await this.ehrMappingRepository.findOne({ where: { ehrName } });
    if (!ehrMapping) {
      throw new NotFoundException(`Mapping configuration not found for EHR: ${ehrName}`);
    }
    const mappingConfig = ehrMapping.mappingConfig;

    const strategy = this.getStrategy(ehrName);
    const mappedData = strategy.mapData(patientData, mappingConfig);
    // Before sending data, ensure transaction consistency (e.g., logging, retry mechanisms)
    // For simplicity, we'll just log here.
    console.log(`Attempting to send data to ${ehrName} with mapping config: ${JSON.stringify(mappingConfig)}`);
    return strategy.sendData(mappedData);
  }

  async saveEhrMapping(ehrName: string, mappingConfig: any): Promise<EhrMapping> {
    let ehrMapping = await this.ehrMappingRepository.findOne({ where: { ehrName } });
    if (ehrMapping) {
      ehrMapping.mappingConfig = mappingConfig;
    } else {
      ehrMapping = this.ehrMappingRepository.create({ ehrName, mappingConfig });
    }
    return this.ehrMappingRepository.save(ehrMapping);
  }

  async getEhrMapping(ehrName: string): Promise<EhrMapping> {
    const ehrMapping = await this.ehrMappingRepository.findOne({ where: { ehrName } });
    if (!ehrMapping) {
      throw new NotFoundException(`Mapping configuration not found for EHR: ${ehrName}`);
    }
    return ehrMapping;
  }
  }
}
