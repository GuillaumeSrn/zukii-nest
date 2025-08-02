import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { IsNotEmpty, IsEnum, IsEmail, IsDateString } from 'class-validator';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Board } from '../../boards/entities/board.entity';
import { User } from '../../users/entities/user.entity';
import { InvitationPermission } from '../enums/invitation.enum';

@Entity('invitations')
@Unique(['boardId', 'email'])
export class Invitation extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  @IsNotEmpty()
  boardId: string;

  @Column({ type: 'varchar', length: 255 })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Column({
    type: 'enum',
    enum: InvitationPermission,
    default: InvitationPermission.VIEW,
  })
  @IsEnum(InvitationPermission, {
    message: 'Le niveau de permission doit être view, edit ou admin',
  })
  permissionLevel: InvitationPermission;

  @Column({ type: 'varchar', length: 128, unique: true })
  @Index()
  @IsNotEmpty()
  invitationToken: string;

  @Column({ type: 'uuid' })
  @IsNotEmpty()
  invitedBy: string;

  @Column({ type: 'timestamp' })
  @IsDateString()
  @IsNotEmpty()
  expiresAt: Date;

  // Relations
  @ManyToOne(() => Board, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardId' })
  board: Board;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'invitedBy' })
  invitedByUser: User;
}
