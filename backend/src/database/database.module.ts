import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: process.env.POSTGRES_USER || 'malong', // Use local PostgreSQL user
      password: process.env.POSTGRES_PASSWORD || '', // No password for local
      database: 'ehr_db',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true, // In production, this should be false and migrations used
      retryAttempts: 10,
      retryDelay: 3000,
      autoLoadEntities: true,
    }),
  ],
})
export class DatabaseModule {}

