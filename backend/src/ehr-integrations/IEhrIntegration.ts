export interface IEhrIntegration {
  sendData(patientData: any): Promise<any>;
  getEHRName(): string;
  mapData(patientData: any, mappingConfig: any): any;
}
