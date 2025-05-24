import { Entity, Column, OneToMany, Index } from 'typeorm';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from './user-role.entity';

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

  @OneToMany(() => UserRole, (userRole) => userRole.user, { cascade: true })
  userRoles: UserRole[];
}
