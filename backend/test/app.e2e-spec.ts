import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('EHR Integration Platform (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Basic App Tests', () => {
    it('/ (GET) - should return Hello World', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('EHR Integration Endpoints', () => {
    const validPatientData = {
      firstName: 'John',
      lastName: 'Doe',
      age: 30,
      gender: 'male',
      contact: {
        email: 'john.doe@example.com',
        phone: '555-123-4567',
        address: '123 Main St, City, State 12345'
      },
      allergies: ['Penicillin', 'Shellfish'],
      medicalHistory: {
        diabetes: 'Type 2',
        hypertension: 'Controlled'
      }
    };

    it('/ehr/send-patient-data (POST) - should send patient data to Athena', async () => {
      const response = await request(app.getHttpServer())
        .post('/ehr/send-patient-data')
        .send({
          ehrName: 'Athena',
          patientData: validPatientData
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('transactionId');
    });

    it('/ehr/send-patient-data (POST) - should send patient data to Allscripts', async () => {
      const response = await request(app.getHttpServer())
        .post('/ehr/send-patient-data')
        .send({
          ehrName: 'Allscripts',
          patientData: validPatientData
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('transactionId');
    });

    it('/ehr/send-patient-data (POST) - should reject invalid EHR name', async () => {
      await request(app.getHttpServer())
        .post('/ehr/send-patient-data')
        .send({
          ehrName: 'InvalidEHR',
          patientData: validPatientData
        })
        .expect(500);
    });

    it('/ehr/send-patient-data (POST) - should reject invalid patient data', async () => {
      await request(app.getHttpServer())
        .post('/ehr/send-patient-data')
        .send({
          ehrName: 'Athena',
          patientData: {
            // Missing required fields
            firstName: 'John'
          }
        })
        .expect(400);
    });

    it('/ehr/mapping/Athena (GET) - should get Athena mapping configuration', async () => {
      const response = await request(app.getHttpServer())
        .get('/ehr/mapping/Athena')
        .expect(200);

      expect(response.body).toHaveProperty('ehrName', 'Athena');
      expect(response.body).toHaveProperty('mappingConfig');
    });

    it('/ehr/mapping/Allscripts (GET) - should get Allscripts mapping configuration', async () => {
      const response = await request(app.getHttpServer())
        .get('/ehr/mapping/Allscripts')
        .expect(200);

      expect(response.body).toHaveProperty('ehrName', 'Allscripts');
      expect(response.body).toHaveProperty('mappingConfig');
    });

    it('/ehr/transactions (GET) - should get transaction logs', async () => {
      const response = await request(app.getHttpServer())
        .get('/ehr/transactions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('/ehr/transactions (GET) - should filter by EHR name', async () => {
      const response = await request(app.getHttpServer())
        .get('/ehr/transactions?ehrName=Athena')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('/ehr/transactions (GET) - should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/ehr/transactions?status=pending')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
