import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SuperBlockResponseDto {
  @ApiProperty({
    description: 'ID unique du super-block',
    example: 'super-block-uuid-123',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'ID du board associé',
    example: 'board-uuid-123',
  })
  @Expose()
  boardId: string;

  @ApiProperty({
    description: 'Titre du super-block',
    example: 'Analyse Ventes Q4',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Couleur du super-block',
    example: '#6366f1',
  })
  @Expose()
  color: string;

  @ApiProperty({
    description: 'État replié/déplié du super-block',
    example: false,
  })
  @Expose()
  collapsed: boolean;

  @ApiProperty({
    description: "Ordre d'affichage du super-block",
    example: 0,
  })
  @Expose()
  displayOrder: number;

  @ApiProperty({
    description: 'Date de création',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière modification',
    example: '2024-01-15T11:30:00Z',
  })
  @Expose()
  updatedAt: Date;
}
