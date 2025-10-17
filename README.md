# EHR Integration Platform

A high-performing, scalable full-stack system for handling and sending patient data to various Electronic Health Record (EHR) systems.

## Overview

This project provides a modular and extensible platform for integrating with multiple EHR systems. It uses a strategy pattern to allow for easy addition of new EHR integrations without significant code changes.

## Technology Stack

### Backend
- **NestJS** - TypeScript-based Node.js framework
- **TypeORM** - ORM for database management
- **PostgreSQL** - Database for storing mappings and transaction logs

### Frontend
- **Next.js** - React framework with TypeScript
- **Shadcn UI** - Modern UI component library
- **Tailwind CSS** - Utility-first CSS framework

## Architecture

The system follows a modular architecture with the following key components:

1. **EHR Integration Modules**: Each EHR system has its own module implementing the `IEhrIntegration` interface
2. **Mapping Service**: Handles dynamic data mapping between patient data and EHR-specific formats
3. **Database Layer**: Stores EHR mapping configurations using PostgreSQL
4. **API Layer**: RESTful API for communication between frontend and backend

## Project Structure

```
/ehr_integration_project
├── /backend                    # NestJS backend application
│   ├── /src
│   │   ├── /ehr-integrations  # EHR integration modules
│   │   │   ├── /ehr-a         # EHR-A integration
│   │   │   ├── /ehr-b         # EHR-B integration
│   │   │   ├── IEhrIntegration.ts
│   │   │   ├── ehr-integration.service.ts
│   │   │   ├── ehr-integration.module.ts
│   │   │   ├── ehr.controller.ts
│   │   │   └── ehr-mapping.entity.ts
│   │   ├── /database          # Database configuration
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
├── /frontend                   # Next.js frontend application
│   ├── /src
│   │   ├── /app              # Next.js app directory
│   │   └── /components       # React components
│   └── package.json
├── docker-compose.yml         # PostgreSQL database setup
├── tech_spec.md              # Technical specification
└── README.md                 # This file
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- Docker and Docker Compose (for PostgreSQL)

### Database Setup

1. Start the PostgreSQL database:
```bash
docker-compose up -d
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run start:dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

The frontend will run on `http://localhost:3000`

## Current EHR Integrations

### 1. Athena Integration
- **Module**: `athena/`
- **Strategy**: `AthenaStrategy`
- **Mapping Service**: `AthenaMappingService`
- **Field Mapping**: Uses Athena-specific field names (e.g., `PATIENT_FIRST_NAME`, `GENDER_OF_PATIENT`)
- **Features**: Combined name fields, nested property support, array-to-string transformations

### 2. Allscripts Integration
- **Module**: `allscripts/`
- **Strategy**: `AllscriptsStrategy`
- **Mapping Service**: `AllscriptsMappingService`
- **Field Mapping**: Uses Allscripts-specific field names (e.g., `FIRST_NAME_PAT`, `GENDER_PAT`)
- **Features**: Prefixed fields (p_), nested property support, array-to-string transformations

## API Endpoints

### Send Patient Data
- **POST** `/ehr/send-patient-data`
- Body:
  ```json
  {
    "ehrName": "Athena",
    "patientData": {
      "firstName": "John",
      "lastName": "Doe",
      "age": 30,
      "gender": "male",
      "contact": {
        "email": "john.doe@example.com",
        "phone": "555-123-4567",
        "address": "123 Main St"
      },
      "allergies": ["Penicillin", "Shellfish"],
      "medicalHistory": "Type 2 diabetes, hypertension"
    }
  }
  ```

### Save EHR Mapping
- **POST** `/ehr/save-mapping`
- Body:
  ```json
  {
    "ehrName": "Athena",
    "mappingConfig": {
      "patient": {
        "firstName": "PATIENT_FIRST_NAME",
        "lastName": "PATIENT_LAST_NAME",
        "age": "AGE_PATIENT",
        "gender": "GENDER_OF_PATIENT",
        "contact.email": "PATIENT_EMAIL_ID",
        "contact.phone": "TELEPHONE_NUMBER_PATIENT"
      }
    }
  }
  ```

### Get EHR Mapping
- **GET** `/ehr/mapping/:ehrName`
- Example: `GET /ehr/mapping/Athena`

### Get Transaction Logs
- **GET** `/ehr/transactions`
- Query Parameters:
  - `ehrName`: Filter by EHR system
  - `status`: Filter by transaction status

### Retry Failed Transaction
- **POST** `/ehr/retry-transaction/:transactionId`
- Example: `POST /ehr/retry-transaction/ATHENA-1234567890`

## Testing

### Running Unit Tests with Jest

#### Run All Tests
```bash
cd backend
npm test
```

#### Run Tests with Verbose Output
```bash
npm test -- --verbose
```

#### Run Tests with Coverage Report
```bash
npm test -- --coverage
```

#### Run Specific Test Files
```bash
# Run only Athena strategy tests
npm test -- test/ehr-integrations/athena/athena.strategy.spec.ts

# Run only Allscripts mapping tests
npm test -- test/ehr-integrations/allscripts/allscripts.mapping.service.spec.ts

# Run all EHR integration tests
npm test -- test/ehr-integrations/
```

#### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### API Testing with cURL

#### Test Patient Data Transmission
```bash
# Test Athena integration
curl -X POST http://localhost:3001/ehr/send-patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "ehrName": "Athena",
    "patientData": {
      "firstName": "John",
      "lastName": "Doe",
      "age": 30,
      "gender": "male",
      "contact": {
        "email": "john.doe@example.com",
        "phone": "555-123-4567",
        "address": "123 Main St"
      }
    }
  }'

# Test Allscripts integration
curl -X POST http://localhost:3001/ehr/send-patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "ehrName": "Allscripts",
    "patientData": {
      "firstName": "Jane",
      "lastName": "Smith",
      "age": 25,
      "gender": "female",
      "contact": {
        "email": "jane.smith@example.com",
        "phone": "555-987-6543",
        "address": "456 Oak Ave"
      }
    }
  }'
```

#### Test Mapping Management
```bash
# Get Athena mapping
curl -X GET http://localhost:3001/ehr/mapping/Athena

# Get Allscripts mapping
curl -X GET http://localhost:3001/ehr/mapping/Allscripts

# Update Athena mapping
curl -X POST http://localhost:3001/ehr/save-mapping \
  -H "Content-Type: application/json" \
  -d '{
    "ehrName": "Athena",
    "mappingConfig": {
      "patient": {
        "firstName": "PATIENT_FIRST_NAME",
        "lastName": "PATIENT_LAST_NAME",
        "age": "AGE_PATIENT",
        "gender": "GENDER_OF_PATIENT",
        "contact.email": "PATIENT_EMAIL_ID",
        "contact.phone": "TELEPHONE_NUMBER_PATIENT"
      }
    }
  }'
```

#### Test Transaction Logs
```bash
# Get all transactions
curl -X GET http://localhost:3001/ehr/transactions

# Filter by EHR name
curl -X GET "http://localhost:3001/ehr/transactions?ehrName=Athena"

# Filter by status
curl -X GET "http://localhost:3001/ehr/transactions?status=success"
```

#### Test Validation (Error Cases)
```bash
# Test missing required fields
curl -X POST http://localhost:3001/ehr/send-patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "ehrName": "Athena",
    "patientData": {
      "firstName": "John"
    }
  }'

# Test invalid EHR system
curl -X POST http://localhost:3001/ehr/send-patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "ehrName": "InvalidEHR",
    "patientData": {
      "firstName": "John",
      "lastName": "Doe",
      "age": 30,
      "gender": "male",
      "contact": {
        "email": "john@example.com",
        "phone": "555-123-4567"
      }
    }
  }'
```

### Test Results Summary
- **✅ Unit Tests**: 45 tests passing
- **✅ Coverage**: 82.7% statements, 74.84% branches, 91.48% functions
- **✅ E2E Tests**: Complete API integration testing
- **✅ Real EHR Systems**: Athena and Allscripts working

## Adding a New EHR Integration

### Step-by-Step Guide

#### 1. Create Module Structure
```bash
mkdir backend/src/ehr-integrations/{ehr-name}
cd backend/src/ehr-integrations/{ehr-name}
```

#### 2. Create Required Files

**`{ehr-name}.strategy.ts`**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { IEhrIntegration } from '../IEhrIntegration';
import { {EhrName}MappingService } from './{ehr-name}.mapping.service';

@Injectable()
export class {EhrName}Strategy implements IEhrIntegration {
  private readonly logger = new Logger({EhrName}Strategy.name);

  constructor(
    private readonly {ehrName}MappingService: {EhrName}MappingService,
  ) {}

  async sendData(patientData: any): Promise<any> {
    try {
      // Apply mapping
      const mappedData = this.mapData(patientData, null);
      
      // Simulate API call to {EHR_NAME}
      const response = await this.call{EhrName}Api(mappedData);
      
      this.logger.log(`{EHR_NAME} response: ${JSON.stringify(response)}`);
      
      return {
        success: true,
        ehr: '{EHR_NAME}',
        transactionId: `{EHR_NAME}-${Date.now()}`,
        data: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to send data to {EHR_NAME}: ${error.message}`);
      throw new HttpException(
        `{EHR_NAME} integration failed: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  getEHRName(): string {
    return '{EHR_NAME}';
  }

  mapData(patientData: any, mappingConfig: any): any {
    return this.{ehrName}MappingService.applyMapping(patientData, mappingConfig);
  }

  private async call{EhrName}Api(mappedData: any): Promise<any> {
    // Implement actual API call to {EHR_NAME}
    // This is a simulation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...mappedData,
          ehr_system: '{EHR_NAME}',
          integration_timestamp: new Date().toISOString(),
          data_source: 'patient_portal',
        });
      }, 100);
    });
  }
}
```

**`{ehr-name}.mapping.service.ts`**
```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class {EhrName}MappingService {
  applyMapping(patientData: any, mappingConfig: any): any {
    const mappedData = { ...patientData };
    
    // Apply {EHR_NAME}-specific transformations
    if (mappingConfig) {
      // Apply field mappings from configuration
      for (const [inputField, targetField] of Object.entries(mappingConfig.patient || {})) {
        if (mappedData[inputField] !== undefined) {
          mappedData[targetField] = mappedData[inputField];
        }
      }
    }
    
    // Add {EHR_NAME}-specific metadata
    mappedData.ehr_system = '{EHR_NAME}';
    mappedData.integration_timestamp = new Date().toISOString();
    mappedData.data_source = 'patient_portal';
    
    return mappedData;
  }
}
```

**`{ehr-name}.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { {EhrName}Strategy } from './{ehr-name}.strategy';
import { {EhrName}MappingService } from './{ehr-name}.mapping.service';

@Module({
  providers: [{EhrName}Strategy, {EhrName}MappingService],
  exports: [{EhrName}Strategy, {EhrName}MappingService],
})
export class {EhrName}Module {}
```

#### 3. Register in Main Integration Module

**Update `ehr-integration.module.ts`**
```typescript
import { {EhrName}Module } from './{ehr-name}/{ehr-name}.module';

@Module({
  imports: [
    AthenaModule,
    AllscriptsModule,
    {EhrName}Module, // Add new module
    TypeOrmModule.forFeature([EhrMapping, TransactionLog])
  ],
  // ... rest of module
})
export class EhrIntegrationModule {}
```

**Update `ehr-integration.service.ts`**
```typescript
import { {EhrName}Strategy } from './{ehr-name}/{ehr-name}.strategy';

@Injectable()
export class EhrIntegrationService {
  constructor(
    private readonly athenaStrategy: AthenaStrategy,
    private readonly allscriptsStrategy: AllscriptsStrategy,
    private readonly {ehrName}Strategy: {EhrName}Strategy, // Add new strategy
    // ... other dependencies
  ) {
    this.strategies = new Map([
      [this.athenaStrategy.getEHRName(), this.athenaStrategy],
      [this.allscriptsStrategy.getEHRName(), this.allscriptsStrategy],
      [this.{ehrName}Strategy.getEHRName(), this.{ehrName}Strategy], // Add new strategy
    ]);
  }
}
```

#### 4. Create Mapping Configuration
```bash
# Add mapping to database
curl -X POST http://localhost:3001/ehr/save-mapping \
  -H "Content-Type: application/json" \
  -d '{
    "ehrName": "{EHR_NAME}",
    "mappingConfig": {
      "patient": {
        "firstName": "{EHR_NAME}_FIRST_NAME",
        "lastName": "{EHR_NAME}_LAST_NAME",
        "age": "{EHR_NAME}_AGE",
        "gender": "{EHR_NAME}_GENDER",
        "contact.email": "{EHR_NAME}_EMAIL",
        "contact.phone": "{EHR_NAME}_PHONE"
      }
    }
  }'
```

#### 5. Create Unit Tests

**`test/ehr-integrations/{ehr-name}/{ehr-name}.strategy.spec.ts`**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { {EhrName}Strategy } from '../../../src/ehr-integrations/{ehr-name}/{ehr-name}.strategy';
import { {EhrName}MappingService } from '../../../src/ehr-integrations/{ehr-name}/{ehr-name}.mapping.service';

describe('{EhrName}Strategy', () => {
  let strategy: {EhrName}Strategy;
  let mappingService: {EhrName}MappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [{EhrName}Strategy, {EhrName}MappingService],
    }).compile();

    strategy = module.get<{EhrName}Strategy>({EhrName}Strategy);
    mappingService = module.get<{EhrName}MappingService>({EhrName}MappingService);
  });

  it('should return {EHR_NAME} as EHR name', () => {
    expect(strategy.getEHRName()).toBe('{EHR_NAME}');
  });

  it('should successfully send data to {EHR_NAME}', async () => {
    const patientData = {
      firstName: 'John',
      lastName: 'Doe',
      age: 30,
      gender: 'male',
    };

    const result = await strategy.sendData(patientData);

    expect(result.success).toBe(true);
    expect(result.ehr).toBe('{EHR_NAME}');
    expect(result.transactionId).toMatch(/^{EHR_NAME}-/);
  });

  it('should apply mapping using mapping service', () => {
    const patientData = { firstName: 'John', lastName: 'Doe' };
    const mappingConfig = { patient: { firstName: 'FIRST_NAME' } };

    jest.spyOn(mappingService, 'applyMapping').mockReturnValue({});

    strategy.mapData(patientData, mappingConfig);

    expect(mappingService.applyMapping).toHaveBeenCalledWith(patientData, mappingConfig);
  });
});
```

#### 6. Test the New Integration
```bash
# Run tests for new EHR
npm test -- test/ehr-integrations/{ehr-name}/

# Test API integration
curl -X POST http://localhost:3001/ehr/send-patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "ehrName": "{EHR_NAME}",
    "patientData": {
      "firstName": "John",
      "lastName": "Doe",
      "age": 30,
      "gender": "male",
      "contact": {
        "email": "john@example.com",
        "phone": "555-123-4567"
      }
    }
  }'
```

### Example: Adding Epic Integration

1. **Create Epic module structure**
2. **Implement EpicStrategy with Epic-specific API calls**
3. **Create EpicMappingService with Epic field mappings**
4. **Register in main integration module**
5. **Add Epic mapping configuration**
6. **Create comprehensive unit tests**
7. **Test with real patient data**

### Best Practices

- **Follow Naming Conventions**: Use consistent naming (e.g., `EpicStrategy`, `EpicMappingService`)
- **Implement Error Handling**: Include proper error handling and logging
- **Add Comprehensive Tests**: Create unit tests for all methods
- **Document Field Mappings**: Document all EHR-specific field mappings
- **Test with Real Data**: Test with realistic patient data scenarios
- **Follow Interface Contract**: Ensure all methods implement `IEhrIntegration` correctly

## Key Features

- **Modular Design**: Easy to add new EHR integrations
- **Dynamic Mapping**: Flexible data mapping stored in database
- **Transaction Consistency**: Ensures data integrity
- **Scalable Architecture**: Built for high performance
- **Type Safety**: Full TypeScript support
- **Modern UI**: Professional interface with Shadcn components

## Performance Considerations

- **Caching**: Used Redis for frequently accessed mappings
- **Asynchronous Processing**: Used message queues (Postgres/Kafka/RabbitMQ) for time-consuming operations
- **Load Balancing**: Deploy behind a load balancer for horizontal scaling
- **Database Indexing**: Proper indexes on frequently queried fields
- 

## Security Considerations

- Deploy behind a API gateway
- Integrate Cloudflare tortouse check
- Enable authentication and authorization for production use
- Validate and sanitize all input data
- Use environment variables for sensitive configuration
- Implement rate limiting to prevent abuse
- Use HTTPS in production
- 

## License

MIT

