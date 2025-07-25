import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class AnalysisContentResponseDto {
  @ApiProperty({ description: "ID unique du contenu d'analyse" })
  @Expose()
  id: string;

  @ApiProperty({ description: "Titre de l'analyse" })
  @Expose()
  title: string;

  @ApiProperty({ description: "Contenu de l'analyse" })
  @Expose()
  content: string;

  @ApiPropertyOptional({ description: "Métadonnées de l'analyse" })
  @Expose()
  metadata?: Record<string, unknown>;

  @ApiProperty({ description: "Statut de l'analyse" })
  @Expose()
  status: string;

  @ApiPropertyOptional({ description: "Résultats de l'analyse" })
  @Expose()
  results?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'IDs des fichiers liés' })
  @Expose()
  linkedFileIds?: string[];

  @ApiProperty({ description: 'Date de création' })
  @Expose()
  @Transform(({ value }) => (value as Date).toISOString())
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  @Expose()
  @Transform(({ value }) => (value as Date).toISOString())
  updatedAt: Date;
}
