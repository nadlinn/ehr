# 🗺️ **EHR Mapping Management & Deployment Guide**

## **📋 Current EHR Mapping Configuration**

### **How EHR Mappings Are Currently Configured**

Our EHR Integration Platform uses a **hybrid approach** for mapping configuration:

1. **Static JSON Configuration** (`ehr-mapping.json`) - Base mapping definitions
2. **Database Storage** (`EhrMapping` entity) - Runtime mapping management
3. **Caching Layer** (Redis) - Performance optimization
4. **Multi-Endpoint Architecture** - Specialized endpoints per EHR system

---

## **🏗️ Current Architecture**

### **1. Static Configuration File**

**Location**: `ehr-mapping.json` (root directory)

**Structure**:
```json
{
  "Athena": {
    "endpoints": [
      {
        "endpointName": "patient_demographics",
        "endpointUrl": "https://api.athenahealth.com/v1/patients",
        "supportedFields": ["firstName", "lastName", "gender", "age", "dob", "contact"],
        "description": "Patient demographic information"
      },
      {
        "endpointName": "medical_history",
        "endpointUrl": "https://api.athenahealth.com/v1/patients/{patientId}/medical-history",
        "supportedFields": ["medicalHistory", "allergies", "currentMedications", "symptoms"],
        "description": "Medical history and current conditions"
      }
      // ... more endpoints
    ],
    "fieldMappings": {
      "patient_demographics": {
        "firstName": "PATIENT_FIRST_NAME",
        "lastName": "PATIENT_LAST_NAME",
        "gender": "GENDER_OF_PATIENT",
        "age": "AGE_PATIENT",
        "contact.email": "PATIENT_EMAIL_ID",
        "contact.phone": "TELEPHONE_NUMBER_PATIENT"
      },
      "medical_history": {
        "medicalHistory": "HISTORY_MEDICAL_PATIENT",
        "allergies": "ALLERGIES_PATIENT",
        "symptoms": "CURRENT_SYMPTOMS_PATIENT"
      }
      // ... more endpoint mappings
    }
  },
  "Allscripts": {
    // Similar structure for Allscripts
  }
}
```

### **2. Database Entity**

**Entity**: `EhrMapping`
```typescript
@Entity()
export class EhrMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  ehrName: string;

  @Column({ type: 'jsonb' })
  mappingConfig: any;
}
```

### **3. Service Layer**

**Service**: `MultiEndpointEhrService`
```typescript
async getEhrMapping(ehrName: string): Promise<EhrMapping | null> {
  // 1. Check cache first
  let mapping = await this.cacheService.getEhrMapping(ehrName);
  if (mapping) {
    return mapping;
  }

  // 2. Check database
  mapping = await this.ehrMappingRepository.findOne({ where: { ehrName } });
  if (mapping) {
    // 3. Cache the result
    await this.cacheService.setEhrMapping(ehrName, mapping);
  }
  return mapping;
}
```

---

## **🌱 Seed Data Management**

### **Current State: Manual Seeding Required**

**❌ Problem**: The system currently **lacks automated seed data management**. EHR mappings must be manually loaded into the database.

### **Missing Components**:
1. **No seed scripts** for initial data loading
2. **No migration system** for mapping updates
3. **No automated deployment** of mapping configurations
4. **No version control** for mapping changes

### **Manual Seeding Process** (Current):

1. **Start the application**
2. **Use the frontend UI** to manually configure mappings
3. **Or use database tools** to insert mapping data directly

---

## **🚀 New Environment Deployment Guide**

### **Prerequisites**

1. **PostgreSQL Database** running locally or remotely
2. **Node.js** (v18+) and npm
3. **Environment Variables** configured
4. **Database Access** with appropriate permissions

### **Step 1: Environment Setup**

```bash
# 1. Clone the repository
git clone <repository-url>
cd ehr-integration

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Set up environment variables
cp .env.example .env
```

### **Step 2: Database Configuration**

```bash
# Create PostgreSQL database
createdb ehr_db

# Or using psql
psql -U postgres -c "CREATE DATABASE ehr_db;"
```

### **Step 3: Environment Variables**

**Backend** (`.env`):
```env
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=ehr_db

# Application Configuration
NODE_ENV=development
PORT=3001

# Cache Configuration (if using Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### **Step 4: Start Services**

```bash
# Terminal 1: Start Backend
cd backend
npm run start:dev

# Terminal 2: Start Frontend
cd frontend
npm run dev

# Terminal 3: Start PostgreSQL (if not running)
brew services start postgresql@14
# or
sudo systemctl start postgresql
```

---

## **🔧 EHR Mapping Loading Process**

### **Current Manual Process**

#### **Option 1: Using Frontend UI**

1. **Navigate to EHR Mappings tab**
2. **Select EHR system** (Athena/Allscripts)
3. **Configure endpoints and field mappings**
4. **Save configurations**

#### **Option 2: Using Database Directly**

```sql
-- Insert Athena mapping
INSERT INTO ehr_mapping (ehr_name, mapping_config) VALUES (
  'Athena',
  '{
    "endpoints": [
      {
        "endpointName": "patient_demographics",
        "endpointUrl": "https://api.athenahealth.com/v1/patients",
        "supportedFields": ["firstName", "lastName", "gender", "age", "dob", "contact"],
        "description": "Patient demographic information"
      }
    ],
    "fieldMappings": {
      "patient_demographics": {
        "firstName": "PATIENT_FIRST_NAME",
        "lastName": "PATIENT_LAST_NAME",
        "gender": "GENDER_OF_PATIENT",
        "age": "AGE_PATIENT"
      }
    }
  }'
);

-- Insert Allscripts mapping
INSERT INTO ehr_mapping (ehr_name, mapping_config) VALUES (
  'Allscripts',
  '{
    "endpoints": [
      {
        "endpointName": "patient_demographics",
        "endpointUrl": "https://api.allscripts.com/v1/patients",
        "supportedFields": ["firstName", "lastName", "gender", "age", "dob", "contact"],
        "description": "Patient demographic information"
      }
    ],
    "fieldMappings": {
      "patient_demographics": {
        "firstName": "FIRST_NAME_PAT",
        "lastName": "LAST_NAME_PAT",
        "gender": "GENDER_PAT",
        "age": "AGE_PAT"
      }
    }
  }'
);
```

---

## **🛠️ Recommended Improvements**

### **1. Automated Seed Script**

**Create**: `backend/scripts/seed-mappings.ts`

```typescript
import { DataSource } from 'typeorm';
import { EhrMapping } from '../src/ehr-integrations/ehr-mapping.entity';
import * as fs from 'fs';
import * as path from 'path';

async function seedMappings() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER || 'malong',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'ehr_db',
    entities: [EhrMapping],
    synchronize: true,
  });

  await dataSource.initialize();

  // Load mapping configuration from JSON file
  const mappingConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../ehr-mapping.json'), 'utf8')
  );

  const ehrMappingRepository = dataSource.getRepository(EhrMapping);

  for (const [ehrName, config] of Object.entries(mappingConfig)) {
    // Check if mapping already exists
    const existingMapping = await ehrMappingRepository.findOne({
      where: { ehrName }
    });

    if (!existingMapping) {
      const mapping = ehrMappingRepository.create({
        ehrName,
        mappingConfig: config
      });

      await ehrMappingRepository.save(mapping);
      console.log(`✅ Seeded mapping for ${ehrName}`);
    } else {
      console.log(`⚠️  Mapping for ${ehrName} already exists`);
    }
  }

  await dataSource.destroy();
  console.log('🎉 Mapping seeding completed!');
}

seedMappings().catch(console.error);
```

### **2. Package.json Scripts**

**Add to `backend/package.json`**:
```json
{
  "scripts": {
    "seed:mappings": "ts-node scripts/seed-mappings.ts",
    "seed:all": "npm run seed:mappings",
    "setup:dev": "npm run seed:all",
    "setup:prod": "npm run build && npm run seed:all"
  }
}
```

### **3. Docker Compose for Development**

**Create**: `docker-compose.dev.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: ehr_db
      POSTGRES_USER: ehr_user
      POSTGRES_PASSWORD: ehr_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_USER=ehr_user
      - POSTGRES_PASSWORD=ehr_password
      - POSTGRES_DB=ehr_db
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    command: npm run start:dev

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    depends_on:
      - backend

volumes:
  postgres_data:
```

### **4. Environment-Specific Configuration**

**Create**: `backend/config/database.config.ts`

```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER || 'malong',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'ehr_db',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: !isProduction, // Use migrations in production
    retryAttempts: 10,
    retryDelay: 3000,
    autoLoadEntities: true,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  };
};
```

---

## **📋 Complete Deployment Checklist**

### **For New Environment Setup**

#### **✅ Prerequisites**
- [ ] PostgreSQL database created
- [ ] Node.js and npm installed
- [ ] Environment variables configured
- [ ] Network access to database

#### **✅ Backend Setup**
- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Configure environment variables
- [ ] Start database service
- [ ] Run seed script (`npm run seed:mappings`)
- [ ] Start backend service (`npm run start:dev`)

#### **✅ Frontend Setup**
- [ ] Install dependencies (`npm install`)
- [ ] Configure API URL
- [ ] Start frontend service (`npm run dev`)

#### **✅ Verification**
- [ ] Backend health check (`http://localhost:3001`)
- [ ] Frontend accessible (`http://localhost:3000`)
- [ ] EHR mappings loaded (check database or UI)
- [ ] API endpoints responding
- [ ] Database connections working

---

## **🔧 Troubleshooting Common Issues**

### **Database Connection Issues**

```bash
# Check PostgreSQL status
brew services list | grep postgresql
# or
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U your_username -d ehr_db -c "SELECT 1;"
```

### **Port Conflicts**

```bash
# Check if ports are in use
lsof -i :3001  # Backend port
lsof -i :3000  # Frontend port
lsof -i :5432  # PostgreSQL port

# Kill processes if needed
kill -9 <PID>
```

### **Mapping Not Loading**

```bash
# Check database for mappings
psql -d ehr_db -c "SELECT ehr_name FROM ehr_mapping;"

# Re-run seed script
cd backend && npm run seed:mappings
```

### **Cache Issues**

```bash
# Clear Redis cache (if using Redis)
redis-cli FLUSHALL

# Or restart the backend service
```

---

## **🚀 Production Deployment**

### **Environment Variables for Production**

```env
# Production Database
POSTGRES_HOST=your-production-db-host
POSTGRES_PORT=5432
POSTGRES_USER=production_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=ehr_production

# Application
NODE_ENV=production
PORT=3001

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Cache
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=redis_password
```

### **Production Database Setup**

```sql
-- Create production database
CREATE DATABASE ehr_production;

-- Create user with appropriate permissions
CREATE USER ehr_production_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ehr_production TO ehr_production_user;
```

### **Production Deployment Script**

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Starting production deployment..."

# 1. Build application
echo "📦 Building application..."
cd backend && npm run build
cd ../frontend && npm run build

# 2. Run database migrations
echo "🗄️  Running database migrations..."
cd ../backend && npm run migration:run

# 3. Seed initial data
echo "🌱 Seeding initial data..."
npm run seed:mappings

# 4. Start application
echo "▶️  Starting application..."
npm run start:prod

echo "✅ Deployment completed!"
```

---

## **📊 Monitoring & Maintenance**

### **Health Checks**

```typescript
// Add to your health check endpoint
@Get('health')
async getHealth() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: await this.checkDatabaseConnection(),
    cache: await this.checkCacheConnection(),
    mappings: await this.checkMappingCount()
  };
}
```

### **Mapping Validation**

```typescript
// Validate mapping configuration
async validateMapping(ehrName: string): Promise<boolean> {
  const mapping = await this.getEhrMapping(ehrName);
  
  if (!mapping) {
    throw new Error(`No mapping found for ${ehrName}`);
  }
  
  // Validate required endpoints
  const requiredEndpoints = ['patient_demographics', 'medical_history'];
  const endpoints = Object.keys(mapping.mappingConfig.fieldMappings);
  
  return requiredEndpoints.every(endpoint => 
    endpoints.includes(endpoint)
  );
}
```

---

## **📋 Summary**

### **Current State**:
- ✅ **Static Configuration**: JSON file with mapping definitions
- ✅ **Database Storage**: TypeORM entity for runtime management
- ✅ **Caching**: Redis for performance optimization
- ✅ **Multi-Endpoint**: Specialized endpoints per EHR system
- ❌ **Automated Seeding**: Manual process required
- ❌ **Migration System**: No version control for mappings
- ❌ **Environment Setup**: Manual configuration required

### **Recommended Improvements**:
1. **Automated Seed Scripts** for initial data loading
2. **Docker Compose** for easy development setup
3. **Environment-Specific Configuration** for different deployments
4. **Migration System** for mapping version control
5. **Health Checks** for monitoring and validation
6. **Production Deployment Scripts** for automated deployment

### **Next Steps**:
1. **Implement seed scripts** for automated data loading
2. **Create Docker Compose** for development environment
3. **Add migration system** for mapping version control
4. **Implement health checks** for monitoring
5. **Create deployment scripts** for production

This comprehensive guide should help you set up the EHR Integration Platform in any new environment while providing a roadmap for improving the current mapping management system! 🚀
