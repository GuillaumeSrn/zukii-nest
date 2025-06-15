import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('status')
@Index(['category', 'name'], { unique: true })
export class Status extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  category: string; // user, board, block, invitation, etc.

  @Column({ type: 'varchar', length: 50 })
  name: string; // active, inactive, pending, completed, etc.

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
