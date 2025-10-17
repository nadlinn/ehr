import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('transaction_logs')
export class TransactionLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ehrName: string;

  @Column('jsonb')
  patientData: any;

  @Column('jsonb', { nullable: true })
  mappedData: any;

  @Column({ default: 'pending' })
  status: 'pending' | 'mapped' | 'queued' | 'success' | 'failed' | 'retrying';

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ nullable: true })
  ehrResponse?: string;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  transactionId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
