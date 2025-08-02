import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('analysis_contents')
export class AnalysisContent extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // 'pending', 'processing', 'completed', 'failed'

  @Column({ type: 'jsonb', nullable: true })
  results?: Record<string, unknown>;

  @Column({ type: 'simple-array', nullable: true })
  linkedFileIds?: string[]; // IDs des fichiers liés à cette analyse
}
