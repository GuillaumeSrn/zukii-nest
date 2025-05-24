import { Exclude, Expose, Type } from 'class-transformer';

class RoleResponseDto {
  @Expose()
  name: string;

  @Expose()
  description?: string;
}

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  displayName: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => RoleResponseDto)
  roles: RoleResponseDto[];

  @Exclude()
  passwordHash: string;

  @Exclude()
  deletedAt?: Date;

  @Exclude()
  deletedBy?: string;
}
