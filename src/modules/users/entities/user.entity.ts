import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Status } from '../../status/entities/status.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  @MinLength(8)
  passwordHash: string;

  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty()
  @MinLength(2)
  displayName: string;

  @Column({ type: 'uuid' })
  statusId: string;

  @ManyToOne(() => Status, { eager: false })
  @JoinColumn({ name: 'statusId' })
  status: Status;
}
