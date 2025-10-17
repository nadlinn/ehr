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

## API Endpoints

### Send Patient Data
- **POST** `/ehr/send-patient-data`
- Body:
  ```json
  {
    "ehrName": "EHR-A",
    "patientData": {
      "symptoms": "...",
      "familyHistory": "...",
      "medications": "..."
    }
  }
  ```

### Save EHR Mapping
- **POST** `/ehr/save-mapping`
- Body:
  ```json
  {
    "ehrName": "EHR-A",
    "mappingConfig": {
      "symptoms": "symptom_field",
      "familyHistory": "family_history_field",
      "medications": "medication_field"
    }
  }
  ```

### Get EHR Mapping
- **POST** `/ehr/get-mapping`
- Body:
  ```json
  {
    "ehrName": "EHR-A"
  }
  ```

## Adding a New EHR Integration

To add a new EHR integration:

1. Create a new directory under `/backend/src/ehr-integrations/ehr-{name}`
2. Create the following files:
   - `ehr-{name}.module.ts`
   - `ehr-{name}.strategy.ts` (implementing `IEhrIntegration`)
   - `ehr-{name}.mapping.service.ts`
3. Register the new module in `ehr-integration.module.ts`
4. Register the strategy in `ehr-integration.service.ts`

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

