# Technical Specification: EHR Integration Platform

**Author:** Lance Ma

**Date:** 2025-10-18

## 1. Introduction

This document outlines the technical design and architecture for a high-performing, scalable, and modular full-stack application. The system is designed to capture patient data and transmit it to various Electronic Health Record (EHR) systems based on client-specific configurations. The primary technologies used are NestJS for the backend and Next.js for the frontend.

### 1.1. Problem Statement

The core challenge is to create a flexible system that can handle patient-provided data from a standardized questionnaire and map it to the correct API endpoints and data fields of different EHR systems. This mapping is unique for each EHR and must be manageable and scalable.

### 1.2. Requirements

- **Modular EHR Integration:** The system must allow for the addition of new EHR integrations with minimal code changes.
- **Dynamic Data Mapping:** A flexible data mapping mechanism is required to translate incoming data to the specific format of each target EHR.
- **Transactional Integrity:** All data transmissions to EHR systems must be atomic and verifiable to ensure data consistency.
- **Scalability and Performance:** The architecture must be designed to handle a growing number of users and EHR integrations without performance degradation.
- **Configuration Management:** Mappings for each EHR should be stored and managed in a way that is easy to update and retrieve.

## 2. System Architecture

A microservices-inspired, decoupled architecture. Backend is a NestJS application responsible for the core business logic, layered and modulized for large scale enterprise application. while frontend is a Next.js application providing the user interface, routing control. Shadcn UI components are used to avoid reinvent the wheel and better addaptive rendering experiences. Communication between the frontend and backend is via a RESTful API for now. ** gRPC/SSE for future enhancements

### 2.1. Backend Architecture (NestJS)

The backend is structured around a core API and a set of modular EHR integrations. This promotes separation of concerns and allows for independent development and deployment of EHR modules.

#### 2.1.1. Core API

The core API will handle:
- User authentication and authorization.
- Patient data intake and validation.
- A generic data processing pipeline.

#### 2.1.2. EHR Integration Modules

Each EHR integration is a separate module within the NestJS application. This modular design is achieved using NestJS's module system. Each module will contain:

- **A `Strategy` class:** This class will implement a common `IEhrIntegration` interface, defining the contract for all EHR integrations. This is an application of the Strategy design pattern.
- **A `Mapping` service:** This service will be responsible for fetching and applying the specific data mappings for that EHR.
- **API client:** A client to communicate with the specific EHR's API.

```typescript
// Example of the IEhrIntegration interface
export interface IEhrIntegration {
  sendData(patientData: any): Promise<any>;
}
```

### 2.2. Frontend Architecture (Next.js)

The frontend is built with Next.js and React. Used Shadcn for UI components to ensure a modern and consistent user experience.

- **Component-Based Design:** The UI will be built as a collection of reusable React components.
- **State Management:** React Context or Redux ToolKit is used to manage application state.
- **Data Fetching:** The frontend will use a library like `axios` or the built-in `fetch` API to communicate with the backend.

## 3. Data Management

### 3.1. Database

PostgreSQL database(my favariate DB) is used to store:
- User and client information.
- Patient data submissions.
- Transaction logs for EHR data transmissions.
pgVector is added for futuure Vector DB/AI integration needes. Also the PostGresSQL is also used as an event queue for now. Kafka/RabitMQ for real event driven in the future

### 3.2. EHR Mapping Management

EHR mappings are stored in a flexible format, such as JSON, within the database. This allows for easy updates and retrieval without requiring code changes. A dedicated table stores these mappings, associated with each EHR integration.

## 4. Performance, Security and Scalability

- **Caching:** A caching layer (Postgres KV, Redis) is implemented to cache frequently accessed data, such as EHR mappings.
- **Asynchronous Processing:** For time-consuming operations like bulk sending data to an EHR, will use a message queue (Postgres for now, Kafka/RabbitMQ for real production..) to process these tasks asynchronously.
- **Load Balancing:** In a production environment, the application would be deployed behind a load balancer to distribute traffic across multiple instances.
- **Vertical Scaling:** In a production environment, the application would be deployed in K8s for automatic scaling in need.
- **Security:** In a production environment, the application would be deployed behind a API Gateway to avid abuse.
...

## 5. Project Structure

```
/ehr_integration_project
|-- /backend
|   |-- /src
|   |   |-- /ehr-integrations
|   |   |   |-- /ehr-a
|   |   |   |   |-- ehr-a.module.ts
|   |   |   |   |-- ehr-a.strategy.ts
|   |   |   |   |-- ehr-a.mapping.service.ts
|   |   |   |-- /ehr-b
|   |   |   |-- IEhrIntegration.ts
|   |   |-- /core
|   |-- package.json
|-- /frontend
|   |-- /app
|   |-- /components
|   |-- /lib
|   |-- package.json
|-- tech_spec.md
```

