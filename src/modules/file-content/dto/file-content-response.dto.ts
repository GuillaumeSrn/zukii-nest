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
    description: 'Type de fichier',
    enum: FileType,
    example: FileType.CSV,
  })
  @Expose()
  fileType: FileType;
}
