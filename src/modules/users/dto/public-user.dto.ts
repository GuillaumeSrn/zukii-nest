import { ApiProperty } from '@nestjs/swagger';

export class PublicUserDto {
  @ApiProperty({
    description: "Identifiant unique de l'utilisateur",
    example: 'user-abc123',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: "Nom d'affichage public de l'utilisateur",
    example: 'Jean D.',
  })
  displayName: string;

  @ApiProperty({
    description: "Indique si l'utilisateur est actif",
    example: true,
  })
  isActive: boolean;
} 