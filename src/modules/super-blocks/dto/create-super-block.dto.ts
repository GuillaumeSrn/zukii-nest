import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsHexColor,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSuperBlockDto {
  @ApiProperty({
    description: 'Titre du super-block',
    example: 'Analyse Ventes Q4',
    minLength: 1,
    maxLength: 200,
  })
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le titre est requis' })
  @MinLength(1, {
    message: 'Le titre doit contenir au moins 1 caractère',
  })
  @MaxLength(200, {
    message: 'Le titre ne peut pas dépasser 200 caractères',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  title: string;

  @ApiPropertyOptional({
    description: 'Couleur du super-block au format hexadécimal',
    example: '#6366f1',
    pattern: '^#[0-9A-Fa-f]{6}$',
    default: '#6366f1',
    maxLength: 7,
  })
  @IsOptional()
  @IsHexColor({
    message: 'La couleur doit être un code hexadécimal valide (ex: #6366f1)',
  })
  @MaxLength(7, {
    message: 'La couleur ne peut pas dépasser 7 caractères',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'État replié/déplié du super-block',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: "L'état collapsed doit être un booléen" })
  collapsed?: boolean;

  @ApiPropertyOptional({
    description: "Ordre d'affichage du super-block",
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: "L'ordre d'affichage doit être un entier" })
  @Min(0, { message: "L'ordre d'affichage doit être positif ou nul" })
  displayOrder?: number;
}
