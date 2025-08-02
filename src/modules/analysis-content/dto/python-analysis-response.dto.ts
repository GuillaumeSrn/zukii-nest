import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PythonAnalysisResponseDto {
  @ApiProperty({ description: "ID unique de l'analyse" })
  analysis_id: string;

  @ApiProperty({ description: 'Résumé exécutif' })
  summary: string;

  @ApiProperty({ description: 'Insights clés' })
  key_insights: Array<{
    title: string;
    description: string;
    confidence: number;
    category: string;
    supporting_data?: Record<string, unknown>;
  }>;

  @ApiPropertyOptional({ description: 'Anomalies détectées' })
  anomalies?: Array<{
    type: string;
    description: string;
    severity: string;
    affected_columns: string[];
    affected_rows?: number[];
    suggested_action?: string;
  }>;

  @ApiPropertyOptional({ description: 'Recommandations' })
  recommendations?: Array<{
    title: string;
    description: string;
    priority: string;
    impact: string;
    effort: string;
    category: string;
  }>;

  @ApiPropertyOptional({ description: 'Graphiques générés' })
  charts?: Array<{
    type: string;
    title: string;
    description: string;
    data: Record<string, unknown>;
    config?: Record<string, unknown>;
    width?: number;
    height?: number;
  }>;

  @ApiProperty({ description: 'Score de confiance global' })
  confidence_score: number;

  @ApiProperty({ description: 'Métriques de performance' })
  performance_metrics: {
    processing_time: number;
    openai_tokens_used: number;
    openai_response_time: number;
    chart_generation_time: number;
    memory_usage_mb?: number;
  };

  @ApiProperty({ description: 'Rapport de confidentialité' })
  privacy_report: {
    anonymization_applied: boolean;
    sensitive_columns_detected: string[];
    data_retention_days: number;
    compliance_status: string;
    data_processing_purpose: string;
    data_controller: string;
  };

  @ApiProperty({ description: 'Résumé des données analysées' })
  data_summary: Record<string, unknown>;

  @ApiProperty({ description: 'Date de création' })
  created_at: string;
}

export class PythonValidationResponseDto {
  @ApiProperty({ description: 'Fichier valide' })
  valid: boolean;

  @ApiProperty({ description: 'Nom du fichier' })
  filename: string;

  @ApiProperty({ description: 'Taille du fichier' })
  fileSize: number;

  @ApiProperty({ description: 'Nombre de lignes' })
  rows: number;

  @ApiProperty({ description: 'Nombre de colonnes' })
  columns: number;

  @ApiProperty({ description: 'Noms des colonnes' })
  columnNames: string[];

  @ApiProperty({ description: 'Types de données' })
  dataTypes: Record<string, string>;

  @ApiProperty({ description: 'Valeurs manquantes' })
  missingValues: Record<string, number>;
}
