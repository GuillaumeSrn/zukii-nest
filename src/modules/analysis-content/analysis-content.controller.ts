import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { AnalysisContentService } from './analysis-content.service';

interface PythonAnalysisResponse {
  analysis_id: string;
  summary: string;
  insights: unknown[];
  charts: unknown[];
  metrics: Record<string, unknown>;
  anonymization_report: Record<string, unknown>;
  processing_time: number;
}

@ApiTags('analysis-content')
@Controller('analysis-content')
export class AnalysisContentController {
  private readonly logger = new Logger(AnalysisContentController.name);

  constructor(
    private readonly analysisContentService: AnalysisContentService,
  ) {}

  @Post('analyze')
  @ApiOperation({
    summary: 'Lancer une analyse Python simple',
    description:
      'Endpoint REST simple pour analyser des fichiers avec le microservice Python',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  async analyzeFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body()
    body: {
      question: string;
      analysisType?: string;
      includeCharts?: boolean;
      anonymizeData?: boolean;
    },
  ) {
    this.logger.log(`Analyse demandée pour ${files.length} fichiers`);

    if (!files || files.length === 0) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    if (!body.question) {
      throw new BadRequestException("Question d'analyse requise");
    }

    try {
      // Lancer l'analyse Python
      const pythonResult =
        (await this.analysisContentService.analyzeFilesWithPython(
          files,
          body.question,
          {
            analysisType: body.analysisType || 'general',
            includeCharts: body.includeCharts !== false,
            anonymizeData: body.anonymizeData !== false,
          },
        )) as PythonAnalysisResponse;

      // Formater la réponse pour correspondre à nos tables
      const formattedResult = {
        analysisId: pythonResult.analysis_id,
        summary: pythonResult.summary,
        insights: pythonResult.insights || [],
        charts: pythonResult.charts || [],
        metrics: pythonResult.metrics || {},
        anonymizationReport: pythonResult.anonymization_report || {},
        processingTime: pythonResult.processing_time,
        createdAt: new Date().toISOString(),
        status: 'completed',
        filesAnalyzed: files.map((f) => f.originalname),
      };

      this.logger.log(
        `Analyse terminée avec succès: ${formattedResult.analysisId}`,
      );
      return formattedResult;
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'analyse: ${(error as Error).message}`,
      );
      throw new BadRequestException(
        `Erreur d'analyse: ${(error as Error).message}`,
      );
    }
  }
}
