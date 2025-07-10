import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { FileType } from '../enums/file-content.enum';

export class FileContentResponseDto {
  @ApiProperty({
    description: 'ID unique du fichier',
    example: 'file-content-uuid-123',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Nom du fichier',
    example: 'donnees_ventes.csv',
  })
  @Expose()
  fileName: string;

  @ApiProperty({
    description: 'Type MIME du fichier',
    example: 'text/csv',
  })
  @Expose()
  mimeType: string;

  @ApiProperty({
    description: 'Taille du fichier en octets',
    example: 2048,
  })
  @Expose()
  fileSize: number;

  @ApiProperty({
    description: 'Hash MD5 du fichier',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  })
  @Expose()
  md5Hash: string;

  @ApiProperty({
    description: 'Type de fichier',
    enum: FileType,
    example: FileType.CSV,
  })
  @Expose()
  fileType: FileType;

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