import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class EhrMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  ehrName: string;

  @Column({ type: 'jsonb' })
  mappingConfig: any;
}
