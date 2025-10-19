-- Initialize EHR Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE ehr_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ehr_db')\gexec

-- Connect to the database
\c ehr_db;

-- Create user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'ehr_user') THEN
        CREATE ROLE ehr_user WITH LOGIN PASSWORD 'ehr_password';
    END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ehr_db TO ehr_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO ehr_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ehr_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ehr_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ehr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ehr_user;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'EHR database initialized successfully';
    RAISE NOTICE 'Database: ehr_db';
    RAISE NOTICE 'User: ehr_user';
    RAISE NOTICE 'Ready for application connection';
END
$$;
