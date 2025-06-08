import { ApiProperty } from '@nestjs/swagger';

export class PublicUserDto {
  @ApiProperty({
    description: "Identifiant unique de l'utilisateur",
    example: '123e4567-e89b-12d3-a456-426614174000',
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