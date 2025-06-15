import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Board } from '../../boards/entities/board.entity';
import { Status } from '../../status/entities/status.entity';
import { BoardMemberPermission } from '../enums/board-member.enum';

@Entity('board_members')
@Unique(['userId', 'boardId'])
export class BoardMember extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  @IsNotEmpty()
  boardId: string;

  @Column({ type: 'uuid' })
  @Index()
  @IsNotEmpty()
  userId: string;

  @Column({
    type: 'enum',
    enum: BoardMemberPermission,
    default: BoardMemberPermission.VIEW,
  })
  @IsEnum(BoardMemberPermission, {
    message: 'Le niveau de permission doit être view, edit ou admin',
  })
  permissionLevel: BoardMemberPermission;

  @Column({ type: 'uuid' })
  @IsNotEmpty()
  statusId: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  // Relations
  @ManyToOne(() => Board, { eager: false })
  @JoinColumn({ name: 'boardId' })
  board: Board;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Status, { eager: false })
  @JoinColumn({ name: 'statusId' })
  status: Status;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'updatedBy' })
  updatedByUser?: User;
}
