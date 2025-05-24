import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('status')
@Index(['type', 'value'], { unique: true })
export class Status extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  type: string; // invitation, member, analysis, file

  @Column({ type: 'varchar', length: 50 })
  value: string; // pending, accepted, declined, expired, running, completed, failed, etc.

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
