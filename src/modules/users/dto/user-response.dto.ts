import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  displayName: string;

  @Expose()
  updatedAt: Date;

  @Exclude()
  passwordHash?: string;

  @Exclude()
  deletedAt?: Date;

  @Exclude()
  deletedBy?: string;
}
