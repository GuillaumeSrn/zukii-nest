import { IsNotEmpty, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BlockRelationType } from '../enums/block-relation.enum';

export class CreateBlockRelationDto {
  @ApiProperty({
    description: 'ID du block source',
    example: 'block-uuid-123',
  })
  @IsUUID('4', { message: "L'ID du block source doit être un UUID valide" })
  @IsNotEmpty({ message: "L'ID du block source est requis" })
  sourceBlockId: string;

  @ApiProperty({
    description: 'ID du block cible',
    example: 'block-uuid-456',
  })
  @IsUUID('4', { message: "L'ID du block cible doit être un UUID valide" })
  @IsNotEmpty({ message: "L'ID du block cible est requis" })
  targetBlockId: string;

  @ApiProperty({
    description: 'Type de relation entre les blocks',
    enum: BlockRelationType,
    example: BlockRelationType.GENERATED_FROM,
  })
  @IsEnum(BlockRelationType, {
    message: 'Le type de relation doit être valide',
  })
  @IsNotEmpty({ message: 'Le type de relation est requis' })
  relationType: BlockRelationType;
}

/**
 * 🆕 DTO simplifié pour création de relation via URL
 * Utilise le blockId de l'URL comme source, évite la redondance
 */
export class CreateBlockRelationFromUrlDto {
  @ApiProperty({
    description: 'ID du block cible',
    example: 'block-uuid-456',
  })
  @IsUUID('4', { message: "L'ID du block cible doit être un UUID valide" })
  @IsNotEmpty({ message: "L'ID du block cible est requis" })
  targetBlockId: string;

  @ApiProperty({
    description: 'Type de relation entre les blocks',
    enum: BlockRelationType,
    example: BlockRelationType.GENERATED_FROM,
  })
  @IsEnum(BlockRelationType, {
    message: 'Le type de relation doit être valide',
  })
  @IsNotEmpty({ message: 'Le type de relation est requis' })
  relationType: BlockRelationType;
}
