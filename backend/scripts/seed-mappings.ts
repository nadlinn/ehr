#!/usr/bin/env ts-node

import { DataSource } from 'typeorm';
import { EhrMapping } from '../src/ehr-integrations/ehr-mapping.entity';
import * as fs from 'fs';
import * as path from 'path';

/**
 * EHR Mapping Seeder Script
 * 
 * This script loads EHR mapping configurations from ehr-mapping.json
 * and seeds them into the database.
 * 
 * Usage:
 *   npm run seed:mappings
 *   ts-node scripts/seed-mappings.ts
 */

async function seedMappings() {
  console.log('🌱 Starting EHR mapping seed process...');

  // Database configuration
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER || 'malong',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'ehr_db',
    entities: [EhrMapping],
    synchronize: true,
    logging: false,
  });

  try {
    // Initialize database connection
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Load mapping configuration from JSON file
    const mappingFilePath = path.join(__dirname, '../ehr-mapping.json');
    console.log(`📄 Loading mapping configuration from: ${mappingFilePath}`);
    
    if (!fs.existsSync(mappingFilePath)) {
      throw new Error(`Mapping configuration file not found: ${mappingFilePath}`);
    }

    const mappingConfig = JSON.parse(
      fs.readFileSync(mappingFilePath, 'utf8')
    );

    console.log(`📋 Found ${Object.keys(mappingConfig).length} EHR systems to seed`);

    const ehrMappingRepository = dataSource.getRepository(EhrMapping);

    // Seed each EHR system mapping
    for (const [ehrName, config] of Object.entries(mappingConfig)) {
      console.log(`\n🔄 Processing ${ehrName} mapping...`);

      // Type assertion for config
      const mappingConfig = config as any;

      // Check if mapping already exists
      const existingMapping = await ehrMappingRepository.findOne({
        where: { ehrName }
      });

      if (existingMapping) {
        console.log(`⚠️  Mapping for ${ehrName} already exists (ID: ${existingMapping.id})`);
        
        // Ask if user wants to update
        const updateExisting = process.argv.includes('--update') || process.argv.includes('-u');
        if (updateExisting) {
          console.log(`🔄 Updating existing mapping for ${ehrName}...`);
          existingMapping.mappingConfig = mappingConfig;
          await ehrMappingRepository.save(existingMapping);
          console.log(`✅ Updated mapping for ${ehrName}`);
        } else {
          console.log(`⏭️  Skipping ${ehrName} (use --update to overwrite)`);
          continue;
        }
      } else {
        // Create new mapping
        const mapping = ehrMappingRepository.create({
          ehrName,
          mappingConfig: mappingConfig
        });

        await ehrMappingRepository.save(mapping);
        console.log(`✅ Created new mapping for ${ehrName} (ID: ${mapping.id})`);
      }

      // Validate mapping structure
      if (mappingConfig.endpoints && Array.isArray(mappingConfig.endpoints)) {
        console.log(`   📊 Endpoints: ${mappingConfig.endpoints.length}`);
        mappingConfig.endpoints.forEach((endpoint: any) => {
          console.log(`      - ${endpoint.endpointName}: ${endpoint.description}`);
        });
      }

      if (mappingConfig.fieldMappings && typeof mappingConfig.fieldMappings === 'object') {
        const endpointCount = Object.keys(mappingConfig.fieldMappings).length;
        console.log(`   🗺️  Field mappings: ${endpointCount} endpoints`);
      }
    }

    // Display summary
    console.log('\n📊 Summary:');
    const allMappings = await ehrMappingRepository.find();
    console.log(`   📋 Total mappings in database: ${allMappings.length}`);
    
    allMappings.forEach(mapping => {
      console.log(`      - ${mapping.ehrName} (ID: ${mapping.id})`);
    });

    console.log('\n🎉 EHR mapping seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error during seeding process:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
🌱 EHR Mapping Seeder

Usage:
  npm run seed:mappings [options]
  ts-node scripts/seed-mappings.ts [options]

Options:
  --update, -u     Update existing mappings
  --help, -h       Show this help message

Examples:
  npm run seed:mappings                    # Seed new mappings only
  npm run seed:mappings -- --update       # Update existing mappings
  ts-node scripts/seed-mappings.ts -u     # Update existing mappings

Environment Variables:
  POSTGRES_HOST     Database host (default: localhost)
  POSTGRES_PORT     Database port (default: 5432)
  POSTGRES_USER     Database user (default: malong)
  POSTGRES_PASSWORD Database password (default: empty)
  POSTGRES_DB       Database name (default: ehr_db)
`);
  process.exit(0);
}

// Run the seeding process
seedMappings().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
