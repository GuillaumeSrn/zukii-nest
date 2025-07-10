import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FileType } from '../enums/file-content.enum';

export class CreateFileContentDto {
  @ApiProperty({
    description: 'Nom du fichier',
    example: 'donnees_ventes.csv',
  })
  @IsString({ message: 'Le nom du fichier doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom du fichier est requis' })
  @MaxLength(255, {
    message: 'Le nom du fichier ne peut pas dépasser 255 caractères',
  })
  fileName: string;

  @ApiProperty({
    description: 'Type MIME du fichier',
    example: 'text/csv',
  })
  @IsString({ message: 'Le type MIME doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le type MIME est requis' })
  @MaxLength(100, {
    message: 'Le type MIME ne peut pas dépasser 100 caractères',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Taille du fichier en octets',
    example: 2048,
  })
  @IsNumber({}, { message: 'La taille du fichier doit être un nombre' })
  @Min(1, { message: 'La taille du fichier doit être supérieure à 0' })
  fileSize: number;

  @ApiProperty({
    description: 'Données du fichier encodées en base64',
    example: 'data:text/csv;base64,Y29sb25uZTE7Y29sb25uZTI...',
  })
  @IsString({ message: 'Les données doivent être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Les données du fichier sont requises' })
  base64Data: string;

  @ApiProperty({
    description: "Hash MD5 du fichier pour vérification d'intégrité",
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  })
  @IsString({ message: 'Le hash MD5 doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le hash MD5 est requis' })
  @MaxLength(32, {
    message: 'Le hash MD5 doit faire exactement 32 caractères',
  })
  md5Hash: string;

  @ApiProperty({
    description: 'Type de fichier',
    enum: FileType,
    example: FileType.CSV,
    required: false,
  })
  @IsOptional()
  @IsEnum(FileType, {
    message: 'Le type de fichier doit être csv, excel ou json',
  })
  fileType?: FileType;
}