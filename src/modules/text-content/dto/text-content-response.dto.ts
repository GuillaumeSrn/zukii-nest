import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { TextContentFormat } from '../enums/text-content.enum';

export class TextContentResponseDto {
  @ApiProperty({
    description: 'ID unique du contenu textuel',
    example: 'text-content-uuid-123',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Contenu textuel',
    example: 'Voici mon contenu de note...',
  })
  @Expose()
  content: string;

  @ApiProperty({
    description: 'Format du contenu',
    enum: TextContentFormat,
    example: TextContentFormat.PLAIN,
  })
  @Expose()
  formatType: TextContentFormat;

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
