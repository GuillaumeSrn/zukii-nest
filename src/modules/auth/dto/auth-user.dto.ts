import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({
    description: "Identifiant unique de l'utilisateur",
    example: 'user-abc123',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: "Adresse email de l'utilisateur",
    example: 'user@example.com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: "Nom d'affichage de l'utilisateur",
    example: 'Jean Dupont',
  })
  displayName: string;
}
