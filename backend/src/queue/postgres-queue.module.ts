import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { PostgresQueueService } from './postgres-queue.service';
import { QueueJob } from './entities/queue-job.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([QueueJob]),
    ScheduleModule.forRoot(),
  ],
  providers: [PostgresQueueService],
  exports: [PostgresQueueService],
})
export class PostgresQueueModule {}
