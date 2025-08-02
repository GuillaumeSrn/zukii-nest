import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnalysisContentDto {
  @ApiProperty({
    description: "Titre de l'analyse",
    example: 'Analyse des ventes Q4',
  })
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  title: string;

  @ApiProperty({
    description: "Contenu de l'analyse (requête, description, etc.)",
    example: 'Analyser les tendances de vente du dernier trimestre',
  })
  @IsString({ message: 'Le contenu doit être une chaîne de caractères' })
  content: string;

  @ApiPropertyOptional({
    description: "Métadonnées de l'analyse",
    example: { type: 'sales_analysis', period: 'Q4' },
  })
  @IsOptional()
  @IsObject({ message: 'Les métadonnées doivent être un objet' })
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'IDs des fichiers liés à cette analyse',
    example: ['file-uuid-1', 'file-uuid-2'],
  })
  @IsOptional()
  @IsArray({ message: 'Les IDs de fichiers doivent être un tableau' })
  linkedFileIds?: string[];

  @ApiPropertyOptional({
    description: "Résultats de l'analyse Python",
    example: { summary: 'Analyse complète', insights: [] },
  })
  @IsOptional()
  @IsObject({ message: 'Les résultats doivent être un objet' })
  results?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "Statut de l'analyse",
    example: 'pending',
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
  @IsOptional()
  @IsString({ message: 'Le statut doit être une chaîne de caractères' })
  status?: string;
}
