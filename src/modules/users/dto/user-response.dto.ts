import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: "Identifiant unique de l'utilisateur",
    example: 'user-abc123',
    format: 'uuid',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "Adresse email de l'utilisateur",
    example: 'user@example.com',
    format: 'email',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: "Nom d'affichage de l'utilisateur",
    example: 'Jean Dupont',
  })
  @Expose()
  displayName: string;

  @ApiProperty({
    description: 'Date de dernière modification',
    example: '2024-01-15T12:45:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  updatedAt: Date;

  @Exclude()
  passwordHash?: string;
}
