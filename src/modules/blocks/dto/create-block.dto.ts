import {
  IsEnum,
  IsString,
  IsInt,
  IsOptional,
  Min,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BlockType } from '../enums/block.enum';

export class CreateBlockDto {
  @ApiProperty({
    description: 'Type de block',
    enum: BlockType,
    example: BlockType.TEXT,
  })
  @IsEnum(BlockType, {
    message: 'Le type de block doit être text, file ou analysis',
  })
  @IsNotEmpty({ message: 'Le type de block est requis' })
  blockType: BlockType;

  @ApiProperty({
    description: 'Titre du block',
    example: 'Mon block de texte',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  title?: string;

  @ApiProperty({
    description: 'Position X du block',
    example: 100,
    minimum: 0,
  })
  @IsInt({ message: 'La position X doit être un entier' })
  @Min(0, { message: 'La position X doit être positive ou nulle' })
  positionX: number;

  @ApiProperty({
    description: 'Position Y du block',
    example: 200,
    minimum: 0,
  })
  @IsInt({ message: 'La position Y doit être un entier' })
  @Min(0, { message: 'La position Y doit être positive ou nulle' })
  positionY: number;

  @ApiProperty({
    description: 'Largeur du block',
    example: 300,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'La largeur doit être un entier' })
  @Min(1, { message: 'La largeur doit être supérieure à 0' })
  width?: number;

  @ApiProperty({
    description: 'Hauteur du block',
    example: 200,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'La hauteur doit être un entier' })
  @Min(1, { message: 'La hauteur doit être supérieure à 0' })
  height?: number;

  @ApiProperty({
    description: "Index Z du block (ordre d'affichage)",
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "L'index Z doit être un entier" })
  zIndex?: number;

  @ApiProperty({
    description: 'ID du contenu associé',
    example: 'content-uuid-123',
  })
  @IsUUID('4', { message: "L'ID du contenu doit être un UUID valide" })
  @IsNotEmpty({ message: "L'ID du contenu est requis" })
  contentId: string;
}
