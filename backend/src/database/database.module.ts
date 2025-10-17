import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'ehr_db',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true, // In production, this should be false and migrations used
    }),
  ],
})
export class DatabaseModule {}

