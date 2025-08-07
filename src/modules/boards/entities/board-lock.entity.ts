import { Entity, Column, Index, Unique } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('board_locks')
@Unique(['boardId'])
export class BoardLock extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  @IsNotEmpty()
  boardId: string;

  @Column({ type: 'uuid' })
  @Index()
  @IsNotEmpty()
  userId: string;

  @Column({ type: 'timestamp' })
  lockedAt: Date;
}
