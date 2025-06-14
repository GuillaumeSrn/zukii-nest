import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PublicUserDto } from '../../users/dto/public-user.dto';

class BoardStatusDto {
  @ApiProperty({
    description: 'Identifiant du statut',
    example: 'board-active',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Nom du statut',
    example: 'active',
  })
  @Expose()
  name: string;
}

export class BoardResponseDto {
  @ApiProperty({
    description: 'Identifiant unique du board',
    example: 'board-abc123',
    format: 'uuid',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Titre du board',
    example: 'Mon Tableau de Bord Projet',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Description du board',
    example: 'Ce tableau contient les analyses de données de notre projet.',
    nullable: true,
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Couleur de fond du board',
    example: '#F5F5F5',
  })
  @Expose()
  backgroundColor: string;

  @ApiProperty({
    description: 'Propriétaire du board',
    type: PublicUserDto,
  })
  @Expose()
  @Type(() => PublicUserDto)
  owner: PublicUserDto;

  @ApiProperty({
    description: 'Status du board',
    type: BoardStatusDto,
  })
  @Expose()
  @Type(() => BoardStatusDto)
  status: BoardStatusDto;

  @ApiProperty({
    description: 'Date de dernière modification',
    example: '2024-01-15T12:45:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  updatedAt: Date;
}
