import { ApiProperty } from '@nestjs/swagger';

export class PublicBoardDto {
  @ApiProperty({
    description: 'Identifiant unique du board',
    example: 'board-abc123',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Titre du board',
    example: 'Mon Tableau de Bord Projet',
  })
  title: string;

  @ApiProperty({
    description: 'Description courte du board',
    example: 'Tableau pour analyses de données',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Couleur de fond du board',
    example: '#F5F5F5',
  })
  backgroundColor: string;

  @ApiProperty({
    description: 'Nom du propriétaire',
    example: 'Jean D.',
  })
  ownerName: string;

  @ApiProperty({
    description: 'Date de création',
    example: '2024-01-15T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;
}
