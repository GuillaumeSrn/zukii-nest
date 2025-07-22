import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsHexColor,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBoardDto {
  @ApiProperty({
    description: 'Titre du board',
    example: 'Mon Tableau de Bord Projet',
    minLength: 3,
    maxLength: 200,
  })
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le titre est requis' })
  @MinLength(3, {
    message: 'Le titre doit contenir au moins 3 caractères',
  })
  @MaxLength(200, {
    message: 'Le titre ne peut pas dépasser 200 caractères',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  title: string;

  @ApiPropertyOptional({
    description: 'Description détaillée du board',
    example: 'Ce tableau contient les analyses de données de notre projet.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(1000, {
    message: 'La description ne peut pas dépasser 1000 caractères',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  description?: string;

  @ApiPropertyOptional({
    description: 'Couleur de fond du board au format hexadécimal',
    example: '#F5F5F5',
    pattern: '^#[0-9A-Fa-f]{6}$',
    default: '#FFFFFF',
    maxLength: 7,
  })
  @IsOptional()
  @IsHexColor({
    message:
      'La couleur de fond doit être un code hexadécimal valide (ex: #FF5733)',
  })
  @MaxLength(7, {
    message: 'La couleur de fond ne peut pas dépasser 7 caractères',
  })
  backgroundColor?: string;
}
