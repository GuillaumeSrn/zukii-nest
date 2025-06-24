import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsHexColor,
} from 'class-validator';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Status } from '../../status/entities/status.entity';
import { BoardMember } from '../../board-members/entities/board-member.entity';

@Entity('boards')
export class Board extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  @IsNotEmpty()
  @MinLength(3, {
    message: 'Le titre du board doit contenir au moins 3 caractères',
  })
  @MaxLength(200, {
    message: 'Le titre du board ne peut pas dépasser 200 caractères',
  })
  title: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description?: string;

  @Column({ type: 'uuid' })
  @Index()
  @IsNotEmpty()
  ownerId: string;

  @Column({ type: 'uuid' })
  @IsNotEmpty()
  statusId: string;

  @Column({ type: 'varchar', length: 7, default: '#FFFFFF' })
  @IsOptional()
  @IsHexColor({
    message: 'La couleur de fond doit être un code hexadécimal valide',
  })
  backgroundColor: string;

  // Relations
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @ManyToOne(() => Status, { eager: false })
  @JoinColumn({ name: 'statusId' })
  status: Status;

  @OneToMany(() => BoardMember, (boardMember) => boardMember.board, {
    eager: false,
  })
  members: BoardMember[];
}
