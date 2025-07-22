import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BlockRelationType } from '../enums/block-relation.enum';

export class BlockRelationResponseDto {
  @ApiProperty({
    description: 'ID unique de la relation',
    example: 'relation-uuid-123',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'ID du block source',
    example: 'block-uuid-123',
  })
  @Expose()
  sourceBlockId: string;

  @ApiProperty({
    description: 'ID du block cible',
    example: 'block-uuid-456',
  })
  @Expose()
  targetBlockId: string;

  @ApiProperty({
    description: 'Type de relation',
    enum: BlockRelationType,
    example: BlockRelationType.GENERATED_FROM,
  })
  @Expose()
  relationType: BlockRelationType;
}
