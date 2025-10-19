# 🚀 **EHR Integration Platform - Setup Guide**

## **📋 Quick Start**

### **For New Environments**

```bash
# 1. Clone the repository
git clone <repository-url>
cd ehr-integration

# 2. Run automated setup
cd backend
npm run setup:dev

# 3. Start services
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Frontend  
cd frontend && npm run dev

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

---

## **🔧 Prerequisites**

### **Required Software**

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **PostgreSQL** (v12 or higher)
- **Git** (for cloning repository)

### **System Requirements**

- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Network**: Internet connection for dependencies

---

## **🗄️ Database Setup**

### **Option 1: Local PostgreSQL (Recommended)**

```bash
# macOS (using Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Windows (using Chocolatey)
choco install postgresql
```

### **Option 2: Docker PostgreSQL**

```bash
# Run PostgreSQL in Docker
docker run --name ehr-postgres \
  -e POSTGRES_DB=ehr_db \
  -e POSTGRES_USER=ehr_user \
  -e POSTGRES_PASSWORD=ehr_password \
  -p 5432:5432 \
  -d postgres:14
```

### **Create Database**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE ehr_db;
CREATE USER ehr_user WITH PASSWORD 'ehr_password';
GRANT ALL PRIVILEGES ON DATABASE ehr_db TO ehr_user;
\q
```

---

## **⚙️ Environment Configuration**

### **Backend Environment (.env)**

Create `backend/.env`:

```env
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=ehr_user
POSTGRES_PASSWORD=ehr_password
POSTGRES_DB=ehr_db

# Application Configuration
NODE_ENV=development
PORT=3001

# Cache Configuration (Optional - for Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Security (Production)
JWT_SECRET=your-jwt-secret-key
ENCRYPTION_KEY=your-encryption-key
```

### **Frontend Environment (.env.local)**

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## **🚀 Automated Setup**

### **Complete Development Setup**

```bash
# Run the automated setup script
cd backend
npm run setup:dev
```

**This script will:**
1. ✅ Check prerequisites (Node.js, npm, PostgreSQL)
2. ✅ Install backend and frontend dependencies
3. ✅ Verify database connection
4. ✅ Initialize database schema
5. ✅ Seed EHR mapping configurations
6. ✅ Verify the complete setup

### **Manual Setup Steps**

If automated setup fails, follow these manual steps:

#### **1. Install Dependencies**

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

#### **2. Database Setup**

```bash
# Ensure PostgreSQL is running
brew services start postgresql@14  # macOS
# or
sudo systemctl start postgresql    # Linux

# Test database connection
psql -h localhost -U ehr_user -d ehr_db -c "SELECT 1;"
```

#### **3. Seed EHR Mappings**

```bash
cd backend
npm run seed:mappings
```

#### **4. Start Services**

```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## **🧪 Verification**

### **Health Checks**

#### **Backend Health**
```bash
curl http://localhost:3001/health
```

#### **Frontend Health**
```bash
curl http://localhost:3000
```

#### **Database Verification**
```bash
# Check if mappings are loaded
psql -d ehr_db -c "SELECT ehr_name FROM ehr_mapping;"
```

### **API Testing**

```bash
# Test EHR endpoints
curl http://localhost:3001/ehr/multi-endpoint/endpoints/Athena

# Test patient data submission
curl -X POST http://localhost:3001/ehr/multi-endpoint/send-patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "ehrName": "Athena",
    "patientData": {
      "firstName": "John",
      "lastName": "Doe",
      "gender": "male",
      "age": 30
    }
  }'
```

---

## **🐳 Docker Setup (Alternative)**

### **Docker Compose**

Create `docker-compose.yml`:

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

### **Run with Docker**

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## **🔧 Troubleshooting**

### **Common Issues**

#### **Database Connection Issues**

```bash
# Check PostgreSQL status
brew services list | grep postgresql
# or
sudo systemctl status postgresql

# Test connection
psql -h localhost -U ehr_user -d ehr_db -c "SELECT 1;"

# Check if database exists
psql -U postgres -c "\l" | grep ehr_db
```

#### **Port Conflicts**

```bash
# Check if ports are in use
lsof -i :3001  # Backend port
lsof -i :3000  # Frontend port
lsof -i :5432  # PostgreSQL port

# Kill processes if needed
kill -9 <PID>
```

#### **Permission Issues**

```bash
# Fix PostgreSQL permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE ehr_db TO ehr_user;
\q
```

#### **Dependency Issues**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### **Logs and Debugging**

#### **Backend Logs**
```bash
cd backend
npm run start:dev
# Check console output for errors
```

#### **Frontend Logs**
```bash
cd frontend
npm run dev
# Check console output for errors
```

#### **Database Logs**
```bash
# PostgreSQL logs (macOS)
tail -f /opt/homebrew/var/log/postgresql@14.log

# PostgreSQL logs (Linux)
tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## **📊 Production Deployment**

### **Environment Variables**

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

### **Production Setup**

```bash
# Build application
cd backend
npm run build

# Run production setup
npm run setup:prod

# Start production server
npm run start:prod
```

---

## **📋 EHR Mapping Management**

### **Current Mapping Configuration**

The system uses a **hybrid approach** for EHR mappings:

1. **Static Configuration**: `ehr-mapping.json` (base definitions)
2. **Database Storage**: `EhrMapping` entity (runtime management)
3. **Caching Layer**: Redis (performance optimization)
4. **Multi-Endpoint**: Specialized endpoints per EHR system

### **Mapping Structure**

```json
{
  "Athena": {
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
        "gender": "GENDER_OF_PATIENT"
      }
    }
  }
}
```

### **Seeding Mappings**

```bash
# Seed all mappings
npm run seed:mappings

# Update existing mappings
npm run seed:mappings -- --update

# Check seeded mappings
psql -d ehr_db -c "SELECT ehr_name, id FROM ehr_mapping;"
```

---

## **🎯 Next Steps**

### **After Setup**

1. **✅ Verify Setup**: Run health checks and API tests
2. **✅ Test EHR Mappings**: Use the frontend to test mapping configurations
3. **✅ Submit Patient Data**: Test the complete patient data submission flow
4. **✅ Monitor Logs**: Check for any errors or issues
5. **✅ Configure Additional EHRs**: Add new EHR systems as needed

### **Development Workflow**

1. **Make Changes**: Edit code in your preferred editor
2. **Test Changes**: Use the development environment
3. **Run Tests**: Execute unit and integration tests
4. **Commit Changes**: Use Git for version control
5. **Deploy**: Use the production setup process

---

## **📞 Support**

### **Getting Help**

- **Documentation**: Check this guide and other markdown files
- **Logs**: Review console output and log files
- **Database**: Verify PostgreSQL connection and data
- **Network**: Check port availability and firewall settings

### **Common Commands**

```bash
# Check system status
npm run setup:dev

# Seed mappings
npm run seed:mappings

# Start development
npm run start:dev

# Run tests
npm test

# Check database
psql -d ehr_db -c "SELECT * FROM ehr_mapping;"
```

---

## **🎉 Success!**

If you've followed this guide successfully, you should have:

- ✅ **Backend running** on http://localhost:3001
- ✅ **Frontend running** on http://localhost:3000
- ✅ **Database connected** with seeded mappings
- ✅ **EHR mappings loaded** for Athena and Allscripts
- ✅ **API endpoints working** for patient data submission
- ✅ **Complete development environment** ready for coding

**Happy coding! 🚀**
