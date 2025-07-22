import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { BlockType } from '../enums/block.enum';
import { StatusResponseDto } from '../../status/dto/status-response.dto';
import { PublicUserDto } from '../../users/dto/public-user.dto';

export class BlockResponseDto {
  @ApiProperty({
    description: 'ID unique du block',
    example: 'block-uuid-123',
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
    description: 'Type de block',
    enum: BlockType,
    example: BlockType.TEXT,
  })
  @Expose()
  blockType: BlockType;

  @ApiProperty({
    description: 'Titre du block',
    example: 'Mon block de texte',
    required: false,
  })
  @Expose()
  title?: string;

  @ApiProperty({
    description: 'Position X du block (optionnel pour organisation en zones)',
    example: 100,
    required: false,
  })
  @Expose()
  positionX?: number;

  @ApiProperty({
    description: 'Position Y du block (optionnel pour organisation en zones)',
    example: 200,
    required: false,
  })
  @Expose()
  positionY?: number;

  @ApiProperty({
    description: 'Largeur du block',
    example: 300,
  })
  @Expose()
  width: number;

  @ApiProperty({
    description: 'Hauteur du block',
    example: 200,
  })
  @Expose()
  height: number;

  @ApiProperty({
    description: "Index Z du block (ordre d'affichage)",
    example: 1,
  })
  @Expose()
  zIndex: number;

  @ApiProperty({
    description: 'ID du contenu associé (pour modification)',
    example: 'content-uuid-123',
  })
  @Expose()
  contentId: string;

  @ApiProperty({
    description: 'ID du super-block parent',
    example: 'super-block-uuid-123',
    required: false,
  })
  @Expose()
  superBlockId?: string;

  @ApiProperty({
    description: 'Type de zone (data, analysis, notes, comments)',
    example: 'data',
    required: false,
  })
  @Expose()
  zoneType?: string;

  @ApiProperty({
    description: 'Statut du block',
    type: StatusResponseDto,
  })
  @Expose()
  @Type(() => StatusResponseDto)
  status: StatusResponseDto;

  @ApiProperty({
    description: 'Utilisateur ayant modifié en dernier',
    type: PublicUserDto,
    required: false,
  })
  @Expose()
  @Type(() => PublicUserDto)
  lastModifiedByUser?: PublicUserDto;

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
