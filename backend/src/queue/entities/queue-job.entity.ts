import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('queue_jobs')
export class QueueJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  jobType: string;

  @Column('jsonb')
  jobData: any;

  @Column({ default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ default: 0 })
  attempts: number;

  @Column({ default: 3 })
  maxAttempts: number;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column('jsonb', { nullable: true })
  result?: any;

  @Column({ nullable: true })
  processedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
