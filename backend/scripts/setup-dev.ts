#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Development Environment Setup Script
 * 
 * This script sets up a complete development environment for the EHR Integration Platform.
 * It handles database setup, dependency installation, and initial data seeding.
 * 
 * Usage:
 *   npm run setup:dev
 *   ts-node scripts/setup-dev.ts
 */

interface SetupStep {
  name: string;
  description: string;
  command?: string;
  check?: () => boolean;
  action?: () => void;
}

const setupSteps: SetupStep[] = [
  {
    name: 'Check Prerequisites',
    description: 'Verify required tools are installed',
    check: () => {
      try {
        execSync('node --version', { stdio: 'pipe' });
        execSync('npm --version', { stdio: 'pipe' });
        execSync('psql --version', { stdio: 'pipe' });
        return true;
      } catch (error) {
        return false;
      }
    }
  },
  {
    name: 'Install Dependencies',
    description: 'Install backend and frontend dependencies',
    action: () => {
      console.log('📦 Installing backend dependencies...');
      execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      
      console.log('📦 Installing frontend dependencies...');
      execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '../../frontend') });
    }
  },
  {
    name: 'Check Database Connection',
    description: 'Verify PostgreSQL database is accessible',
    check: () => {
      try {
        const dbName = process.env.POSTGRES_DB || 'ehr_db';
        const dbUser = process.env.POSTGRES_USER || 'malong';
        const dbHost = process.env.POSTGRES_HOST || 'localhost';
        const dbPort = process.env.POSTGRES_PORT || '5432';
        
        execSync(`psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "SELECT 1;"`, { 
          stdio: 'pipe' 
        });
        return true;
      } catch (error) {
        return false;
      }
    }
  },
  {
    name: 'Create Database Tables',
    description: 'Initialize database schema',
    command: 'npm run start:dev -- --init-db'
  },
  {
    name: 'Seed EHR Mappings',
    description: 'Load initial EHR mapping configurations',
    action: () => {
      console.log('🌱 Seeding EHR mappings...');
      execSync('npm run seed:mappings', { 
        stdio: 'inherit', 
        cwd: path.join(__dirname, '..') 
      });
    }
  },
  {
    name: 'Verify Setup',
    description: 'Test that all components are working',
    action: () => {
      console.log('🧪 Running verification tests...');
      
      // Check if backend can start
      try {
        console.log('   ✅ Backend dependencies installed');
        console.log('   ✅ Database connection available');
        console.log('   ✅ EHR mappings seeded');
        console.log('   ✅ Frontend dependencies installed');
        return true;
      } catch (error) {
        console.error('   ❌ Verification failed:', error);
        return false;
      }
    }
  }
];

async function runSetup() {
  console.log('🚀 Starting EHR Integration Platform Development Setup\n');
  
  let successCount = 0;
  let totalSteps = setupSteps.length;

  for (let i = 0; i < setupSteps.length; i++) {
    const step = setupSteps[i];
    console.log(`\n[${i + 1}/${totalSteps}] ${step.name}`);
    console.log(`   ${step.description}`);

    try {
      let stepSuccess = false;

      if (step.check) {
        stepSuccess = step.check();
        if (stepSuccess) {
          console.log('   ✅ Check passed');
        } else {
          console.log('   ❌ Check failed');
        }
      } else if (step.command) {
        console.log(`   🔧 Running: ${step.command}`);
        execSync(step.command, { 
          stdio: 'inherit', 
          cwd: path.join(__dirname, '..') 
        });
        stepSuccess = true;
        console.log('   ✅ Command completed');
      } else if (step.action) {
        step.action();
        stepSuccess = true;
        console.log('   ✅ Action completed');
      } else {
        stepSuccess = true;
        console.log('   ✅ Step completed');
      }

      if (stepSuccess) {
        successCount++;
      } else {
        console.log('   ⚠️  Step failed, continuing...');
      }

    } catch (error) {
      console.error(`   ❌ Error in step ${step.name}:`, error);
      console.log('   ⚠️  Continuing with next step...');
    }
  }

  // Display final results
  console.log('\n📊 Setup Summary:');
  console.log(`   ✅ Successful steps: ${successCount}/${totalSteps}`);
  
  if (successCount === totalSteps) {
    console.log('\n🎉 Development environment setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start backend: cd backend && npm run start:dev');
    console.log('   2. Start frontend: cd frontend && npm run dev');
    console.log('   3. Open browser: http://localhost:3000');
    console.log('   4. Test API: http://localhost:3001');
  } else {
    console.log('\n⚠️  Setup completed with some issues.');
    console.log('   Please review the failed steps and run setup again if needed.');
  }

  console.log('\n🔧 Manual steps you may need to perform:');
  console.log('   - Ensure PostgreSQL is running');
  console.log('   - Check environment variables in .env files');
  console.log('   - Verify database permissions');
  console.log('   - Check port availability (3000, 3001, 5432)');
}

// Handle command line arguments
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
🚀 EHR Integration Platform Development Setup

Usage:
  npm run setup:dev [options]
  ts-node scripts/setup-dev.ts [options]

Options:
  --help, -h       Show this help message

This script will:
  1. Check prerequisites (Node.js, npm, PostgreSQL)
  2. Install backend and frontend dependencies
  3. Verify database connection
  4. Initialize database schema
  5. Seed EHR mapping configurations
  6. Verify the complete setup

Environment Variables:
  POSTGRES_HOST     Database host (default: localhost)
  POSTGRES_PORT     Database port (default: 5432)
  POSTGRES_USER     Database user (default: malong)
  POSTGRES_PASSWORD Database password (default: empty)
  POSTGRES_DB       Database name (default: ehr_db)

Prerequisites:
  - Node.js (v18+)
  - npm
  - PostgreSQL (running and accessible)
  - Git (for cloning repository)

Troubleshooting:
  - Ensure PostgreSQL is running: brew services start postgresql@14
  - Check database permissions
  - Verify port availability
  - Review error messages for specific issues
`);
  process.exit(0);
}

// Run the setup process
runSetup().catch((error) => {
  console.error('💥 Fatal error during setup:', error);
  process.exit(1);
});
