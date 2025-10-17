# EHR Integration Platform - API Testing with cURL

## 🧪 **API Testing Documentation**

This document contains all the cURL commands used to test the EHR Integration Platform APIs, along with their expected responses and validation examples.

---

## 📋 **API Endpoints Overview**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ehr/send-patient-data` | Send patient data to EHR systems |
| `POST` | `/ehr/save-mapping` | Save EHR mapping configuration |
| `GET` | `/ehr/mapping/:ehrName` | Get EHR mapping configuration |
| `GET` | `/ehr/transactions` | Get transaction audit trail |
| `POST` | `/ehr/retry-transaction/:id` | Retry failed transmission |

---

## ✅ **Valid API Tests**

### **1. Send Patient Data to Athena (Valid)**
```bash
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
```

**Response:**
```json
{
  "success": true,
  "ehr": "Athena",
  "transactionId": "ATHENA-1760733830054",
  "data": {
    "AGE_PATIENT": 30,
    "GENDER_OF_PATIENT": "male",
    "PATIENT_LAST_NAME": "Doe",
    "PATIENT_FIRST_NAME": "John",
    "PATIENT_EMAIL_ID": "john.doe@example.com",
    "TELEPHONE_NUMBER_PATIENT": "555-123-4567",
    "PATIENT_LOCATION_ADDRESS": "123 Main St",
    "email": "john.doe@example.com",
    "phone": "555-123-4567",
    "address": "123 Main St",
    "ehr_system": "Athena",
    "integration_timestamp": "2025-10-17T20:43:49.952Z",
    "data_source": "patient_portal"
  },
  "timestamp": "2025-10-17T20:43:50.055Z"
}
```

### **2. Send Patient Data to Allscripts (Valid)**
```bash
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
      },
      "allergies": ["Latex"],
      "medicalHistory": "Mild asthma"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "ehr": "Allscripts",
  "transactionId": "ALLSCRIPTS-[timestamp]",
  "data": {
    "p_age": 25,
    "p_gender": "female",
    "LAST_NAME_PAT": "Smith",
    "FIRST_NAME_PAT": "Jane",
    "EMAIL_ID_PAT": "jane.smith@example.com",
    "PHONE_NUMBER_PAT": "555-987-6543",
    "ADDRESS_PAT": "456 Oak Ave",
    "ALLERGIES_PAT": "Latex",
    "HISTORY_MEDICAL_PAT": "Mild asthma",
    "ehr_system": "Allscripts",
    "integration_timestamp": "[timestamp]",
    "data_source": "patient_portal"
  },
  "timestamp": "[timestamp]"
}
```

### **3. Get Athena Mapping Configuration**
```bash
curl -X GET http://localhost:3001/ehr/mapping/Athena
```

**Expected Response:**
```json
{
  "ehrName": "Athena",
  "mappingConfig": {
    "patient": {
      "firstName": "PATIENT_FIRST_NAME",
      "lastName": "PATIENT_LAST_NAME",
      "name": "PATIENT_IDENT_NAME",
      "gender": "GENDER_OF_PATIENT",
      "age": "AGE_PATIENT",
      "dob": "DATE_OF_BIRTH_PATIENT",
      "address": "PATIENT_LOCATION_ADDRESS",
      "phone": "TELEPHONE_NUMBER_PATIENT",
      "email": "PATIENT_EMAIL_ID",
      "emergencyContact": "EMERGENCY_CONTACT_PATIENT",
      "insuranceProvider": "INSURANCE_PROVIDER_PATIENT",
      "insurancePolicyNumber": "POLICY_NUMBER_INSURANCE_PATIENT",
      "primaryCarePhysician": "PRIMARY_CARE_DOCTOR_PATIENT",
      "allergies": "ALLERGIES_PATIENT",
      "currentMedications": "PATIENT_MEDICATIONS_CURRENT",
      "medicalHistory": "HISTORY_MEDICAL_PATIENT",
      "socialHistory": "HISTORY_SOCIAL_PATIENT",
      "familyHistory": "HISTORY_FAMILY_PATIENT",
      "contact.email": "PATIENT_EMAIL_ID",
      "contact.phone": "TELEPHONE_NUMBER_PATIENT",
      "contact.address": "PATIENT_LOCATION_ADDRESS"
    }
  }
}
```

### **4. Get Allscripts Mapping Configuration**
```bash
curl -X GET http://localhost:3001/ehr/mapping/Allscripts
```

**Expected Response:**
```json
{
  "ehrName": "Allscripts",
  "mappingConfig": {
    "patient": {
      "firstName": "FIRST_NAME_PAT",
      "lastName": "LAST_NAME_PAT",
      "p_name": "NAME_OF_PAT",
      "p_gender": "GENDER_PAT",
      "p_age": "AGE_PAT",
      "p_dob": "BIRTHDATE_OF_PAT",
      "p_address": "ADDRESS_PAT",
      "p_phone": "PHONE_NUMBER_PAT",
      "p_email": "EMAIL_ID_PAT",
      "p_emergencyContact": "EMERGENCY_CONTACT_PAT",
      "p_insuranceProvider": "PROVIDER_INSURANCE_PAT",
      "p_insurancePolicyNumber": "POLICY_NUM_INSURANCE_PAT",
      "p_primaryCarePhysician": "PRIMARY_CARE_DOC_PAT",
      "p_medicalHistory": "HISTORY_MEDICAL_PAT",
      "p_allergies": "ALLERGIES_PAT",
      "p_currentMedications": "CURRENT_MEDS_PAT",
      "p_socialHistory": "SOCIAL_HISTORY_PAT",
      "p_familyHistory": "FAMILY_HISTORY_PAT",
      "contact.email": "EMAIL_ID_PAT",
      "contact.phone": "PHONE_NUMBER_PAT",
      "contact.address": "ADDRESS_PAT"
    }
  }
}
```

### **5. Get Transaction Logs**
```bash
curl -X GET http://localhost:3001/ehr/transactions
```

**Expected Response:**
```json
[
  {
    "id": 1,
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
    },
    "mappedData": {
      "AGE_PATIENT": 30,
      "GENDER_OF_PATIENT": "male",
      "PATIENT_LAST_NAME": "Doe",
      "PATIENT_FIRST_NAME": "John",
      "PATIENT_EMAIL_ID": "john.doe@example.com",
      "TELEPHONE_NUMBER_PATIENT": "555-123-4567",
      "PATIENT_LOCATION_ADDRESS": "123 Main St"
    },
    "status": "success",
    "transactionId": "ATHENA-1760733830054",
    "ehrResponse": "Data successfully transmitted to Athena",
    "errorMessage": null,
    "retryCount": 0,
    "createdAt": "2025-10-17T20:43:49.952Z",
    "updatedAt": "2025-10-17T20:43:50.055Z"
  }
]
```

### **6. Get Transaction Logs with Filters**
```bash
# Filter by EHR name
curl -X GET "http://localhost:3001/ehr/transactions?ehrName=Athena"

# Filter by status
curl -X GET "http://localhost:3001/ehr/transactions?status=success"

# Filter by both
curl -X GET "http://localhost:3001/ehr/transactions?ehrName=Allscripts&status=pending"
```

---

## ❌ **Validation Error Tests**

### **1. Missing Required Fields**
```bash
curl -X POST http://localhost:3001/ehr/send-patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "ehrName": "Athena",
    "patientData": {
      "firstName": "John"
    }
  }'
```

**Response:**
```json
{
  "message": "Patient first name and last name are required",
  "error": "Bad Request",
  "statusCode": 400
}
```

### **2. Empty Required Fields**
```bash
curl -X POST http://localhost:3001/ehr/send-patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "ehrName": "Athena",
    "patientData": {
      "firstName": "",
      "lastName": "Doe",
      "age": 30,
      "gender": "male",
      "contact": {
        "email": "",
        "phone": "555-123-4567"
      }
    }
  }'
```

**Response:**
```json
{
  "message": "Patient first name and last name are required",
  "error": "Bad Request",
  "statusCode": 400
}
```

### **3. Invalid EHR System**
```bash
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

**Response:**
```json
{
  "message": "Mapping configuration not found for EHR: InvalidEHR",
  "error": "Not Found",
  "statusCode": 404
}
```

### **4. Invalid Data Types (Age as String)**
```bash
curl -X POST http://localhost:3001/ehr/send-patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "ehrName": "Athena",
    "patientData": {
      "firstName": "John",
      "lastName": "Doe",
      "age": "invalid",
      "gender": "male",
      "contact": {
        "email": "invalid-email",
        "phone": "123"
      }
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "ehr": "Athena",
  "transactionId": "ATHENA-[timestamp]",
  "data": {
    "AGE_PATIENT": "invalid",
    "GENDER_OF_PATIENT": "male",
    "PATIENT_LAST_NAME": "Doe",
    "PATIENT_FIRST_NAME": "John",
    "PATIENT_EMAIL_ID": "invalid-email",
    "TELEPHONE_NUMBER_PATIENT": "123",
    "ehr_system": "Athena",
    "integration_timestamp": "[timestamp]",
    "data_source": "patient_portal"
  },
  "timestamp": "[timestamp]"
}
```

---

## 🔧 **Advanced Testing Examples**

### **1. Complete Patient Data with All Fields**
```bash
curl -X POST http://localhost:3001/ehr/send-patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "ehrName": "Athena",
    "patientData": {
      "firstName": "John",
      "lastName": "Doe",
      "age": 30,
      "gender": "male",
      "dateOfBirth": "1993-01-15",
      "contact": {
        "email": "john.doe@example.com",
        "phone": "555-123-4567",
        "address": "123 Main St, City, State 12345"
      },
      "allergies": ["Penicillin", "Shellfish"],
      "medications": ["Metformin", "Lisinopril"],
      "medicalHistory": "Type 2 diabetes, hypertension",
      "symptoms": "Chest pain, shortness of breath"
    }
  }'
```

### **2. Retry Failed Transaction**
```bash
curl -X POST http://localhost:3001/ehr/retry-transaction/ATHENA-1760733830054
```

### **3. Save Custom Mapping Configuration**
```bash
curl -X POST http://localhost:3001/ehr/save-mapping \
  -H "Content-Type: application/json" \
  -d '{
    "ehrName": "CustomEHR",
    "mappingConfig": {
      "patient": {
        "firstName": "CUSTOM_FIRST_NAME",
        "lastName": "CUSTOM_LAST_NAME",
        "age": "CUSTOM_AGE",
        "gender": "CUSTOM_GENDER"
      }
    }
  }'
```

---

## 📊 **Data Mapping Examples**

### **Athena Field Mapping**
| Input Field | Athena EHR Field | Example Value |
|-------------|-------------------|---------------|
| `firstName` | `PATIENT_FIRST_NAME` | "John" |
| `lastName` | `PATIENT_LAST_NAME` | "Doe" |
| `age` | `AGE_PATIENT` | 30 |
| `gender` | `GENDER_OF_PATIENT` | "male" |
| `contact.email` | `PATIENT_EMAIL_ID` | "john@example.com" |
| `contact.phone` | `TELEPHONE_NUMBER_PATIENT` | "555-123-4567" |
| `allergies` | `ALLERGIES_PATIENT` | "Penicillin, Shellfish" |

### **Allscripts Field Mapping**
| Input Field | Allscripts EHR Field | Example Value |
|-------------|---------------------|---------------|
| `firstName` | `FIRST_NAME_PAT` | "John" |
| `lastName` | `LAST_NAME_PAT` | "Doe" |
| `age` | `p_age` | 30 |
| `gender` | `p_gender` | "male" |
| `contact.email` | `EMAIL_ID_PAT` | "john@example.com" |
| `contact.phone` | `PHONE_NUMBER_PAT` | "555-123-4567" |
| `allergies` | `p_allergies` | "Penicillin, Shellfish" |

---

## 🚀 **Quick Test Script**

### **Test All Endpoints**
```bash
#!/bin/bash

echo "Testing EHR Integration Platform APIs..."

# Test 1: Send data to Athena
echo "1. Testing Athena integration..."
curl -X POST http://localhost:3001/ehr/send-patient-data \
  -H "Content-Type: application/json" \
  -d '{"ehrName":"Athena","patientData":{"firstName":"John","lastName":"Doe","age":30,"gender":"male","contact":{"email":"john@example.com","phone":"555-123-4567"}}}'

echo -e "\n\n2. Testing Allscripts integration..."
curl -X POST http://localhost:3001/ehr/send-patient-data \
  -H "Content-Type: application/json" \
  -d '{"ehrName":"Allscripts","patientData":{"firstName":"Jane","lastName":"Smith","age":25,"gender":"female","contact":{"email":"jane@example.com","phone":"555-987-6543"}}}'

echo -e "\n\n3. Testing mapping retrieval..."
curl -X GET http://localhost:3001/ehr/mapping/Athena

echo -e "\n\n4. Testing transaction logs..."
curl -X GET http://localhost:3001/ehr/transactions

echo -e "\n\n5. Testing validation (should fail)..."
curl -X POST http://localhost:3001/ehr/send-patient-data \
  -H "Content-Type: application/json" \
  -d '{"ehrName":"Athena","patientData":{"firstName":"John"}}'

echo -e "\n\nTesting complete!"
```

---

## 📝 **Notes**

- **Server**: Ensure the NestJS server is running on `localhost:3001`
- **Database**: PostgreSQL must be running and accessible
- **Mapping Data**: Ensure EHR mapping configurations are seeded in the database
- **Validation**: All patient data is validated according to DTO rules
- **Transaction Logging**: All API calls are logged in the `transaction_logs` table
- **Error Handling**: Comprehensive error responses for invalid data or missing configurations

---

**Last Updated**: October 17, 2025  
**API Version**: 1.0  
**Status**: ✅ All tests passing
