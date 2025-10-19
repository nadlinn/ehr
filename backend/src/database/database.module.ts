import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      username: process.env.POSTGRES_USER || 'malong',
      password: process.env.POSTGRES_PASSWORD || '',
      database: process.env.POSTGRES_DB || 'ehr_db',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true, // In production, this should be false and migrations used
      retryAttempts: 10,
      retryDelay: 3000,
      autoLoadEntities: true,
    }),
  ],
})
export class DatabaseModule {}

