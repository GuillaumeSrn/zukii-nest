import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TextContentFormat } from '../enums/text-content.enum';

export class CreateTextContentDto {
  @ApiProperty({
    description: 'Contenu textuel',
    example: 'Voici mon contenu de note...',
  })
  @IsString({ message: 'Le contenu doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le contenu est requis' })
  @MaxLength(50000, {
    message: 'Le contenu ne peut pas dépasser 50000 caractères',
  })
  content: string;

  @ApiProperty({
    description: 'Format du contenu',
    enum: TextContentFormat,
    example: TextContentFormat.PLAIN,
    required: false,
  })
  @IsOptional()
  @IsEnum(TextContentFormat, {
    message: 'Le format doit être plain, markdown ou html',
  })
  formatType?: TextContentFormat;
}
