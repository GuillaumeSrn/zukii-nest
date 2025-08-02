import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  HttpStatus,
  HttpCode,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalysisContentService } from './analysis-content.service';
import { AnalysisContentResponseDto } from './dto/analysis-content-response.dto';
import {
  PythonAnalysisResponseDto,
  PythonValidationResponseDto,
} from './dto/python-analysis-response.dto';

@ApiTags('Analysis Content')
@Controller('analysis-content')
export class AnalysisContentController {
  constructor(
    private readonly analysisContentService: AnalysisContentService,
  ) {}

  @Post('analyze')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Analyser un fichier CSV avec IA',
    description:
      'Envoie un fichier CSV au micro-service Python pour analyse IA avec OpenAI GPT',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Fichier CSV à analyser (max 50MB)',
        },
        question: {
          type: 'string',
          description: "Question d'analyse (10-1000 caractères)",
          example: 'Quelles sont les tendances dans ces données de ventes ?',
        },
        analysisType: {
          type: 'string',
          enum: [
            'general',
            'trends',
            'correlations',
            'predictions',
            'statistical',
          ],
          description: "Type d'analyse à effectuer",
          example: 'trends',
        },
        includeCharts: {
          type: 'boolean',
          description: 'Inclure des graphiques dans la réponse',
          example: true,
        },
        anonymizeData: {
          type: 'boolean',
          description: 'Anonymiser les données sensibles',
          example: true,
        },
      },
      required: ['file', 'question'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Analyse réussie',
    type: AnalysisContentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Fichier invalide ou question trop courte',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 500,
    description: "Erreur lors de l'analyse",
  })
  async analyzeFile(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      question: string;
      analysisType?: string;
      includeCharts?: boolean;
      anonymizeData?: boolean;
    },
  ): Promise<PythonAnalysisResponseDto> {
    if (!file) {
      throw new BadRequestException('Fichier requis');
    }

    if (!body.question || body.question.length < 10) {
      throw new BadRequestException(
        "Question d'analyse requise (min 10 caractères)",
      );
    }

    if (body.question.length > 1000) {
      throw new BadRequestException(
        'Question trop longue (max 1000 caractères)',
      );
    }

    // Vérifier le type de fichier
    if (
      !file.mimetype.includes('csv') &&
      !file.mimetype.includes('text/plain')
    ) {
      throw new BadRequestException(
        'Format de fichier non supporté. Utilisez un fichier CSV.',
      );
    }

    // Vérifier la taille du fichier (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new BadRequestException('Fichier trop volumineux (max 50MB)');
    }

    try {
      const analysisResult =
        await this.analysisContentService.analyzeFileWithPython(
          file,
          body.question,
          {
            analysisType: body.analysisType || 'general',
            includeCharts: body.includeCharts !== false, // true par défaut
            anonymizeData: body.anonymizeData !== false, // true par défaut
          },
        );

      return analysisResult;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      throw new BadRequestException(
        `Erreur lors de l'analyse: ${errorMessage}`,
      );
    }
  }

  @Post('analyze/batch')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('files'))
  @ApiOperation({
    summary: 'Analyser plusieurs fichiers CSV avec IA',
    description:
      'Envoie plusieurs fichiers CSV au micro-service Python pour analyse combinée',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Fichiers CSV à analyser (max 10 fichiers, 50MB chacun)',
        },
        question: {
          type: 'string',
          description: "Question d'analyse (10-1000 caractères)",
          example: 'Quelles sont les tendances communes dans ces fichiers ?',
        },
        analysisType: {
          type: 'string',
          enum: [
            'general',
            'trends',
            'correlations',
            'predictions',
            'statistical',
          ],
          description: "Type d'analyse à effectuer",
          example: 'general',
        },
        includeCharts: {
          type: 'boolean',
          description: 'Inclure des graphiques dans la réponse',
          example: true,
        },
        anonymizeData: {
          type: 'boolean',
          description: 'Anonymiser les données sensibles',
          example: true,
        },
      },
      required: ['files', 'question'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Analyse batch réussie',
    type: AnalysisContentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Fichiers invalides ou question trop courte',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 500,
    description: "Erreur lors de l'analyse",
  })
  async analyzeMultipleFiles(
    @UploadedFile() files: Express.Multer.File[],
    @Body()
    body: {
      question: string;
      analysisType?: string;
      includeCharts?: boolean;
      anonymizeData?: boolean;
    },
  ): Promise<PythonAnalysisResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Fichiers requis');
    }

    if (files.length > 10) {
      throw new BadRequestException('Trop de fichiers (max 10)');
    }

    if (!body.question || body.question.length < 10) {
      throw new BadRequestException(
        "Question d'analyse requise (min 10 caractères)",
      );
    }

    if (body.question.length > 1000) {
      throw new BadRequestException(
        'Question trop longue (max 1000 caractères)',
      );
    }

    // Vérifier chaque fichier
    const maxSize = 50 * 1024 * 1024; // 50MB
    for (const file of files) {
      if (
        !file.mimetype.includes('csv') &&
        !file.mimetype.includes('text/plain')
      ) {
        throw new BadRequestException(
          `Format de fichier non supporté pour ${file.originalname}. Utilisez un fichier CSV.`,
        );
      }

      if (file.size > maxSize) {
        throw new BadRequestException(
          `Fichier ${file.originalname} trop volumineux (max 50MB)`,
        );
      }
    }

    try {
      const analysisResult =
        await this.analysisContentService.analyzeMultipleFilesWithPython(
          files,
          body.question,
          {
            analysisType: body.analysisType || 'general',
            includeCharts: body.includeCharts !== false,
            anonymizeData: body.anonymizeData !== false,
          },
        );

      return analysisResult;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      throw new BadRequestException(
        `Erreur lors de l'analyse batch: ${errorMessage}`,
      );
    }
  }

  @Post('validate')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Valider un fichier CSV',
    description: "Valide un fichier CSV sans l'analyser",
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Fichier CSV à valider',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Validation réussie',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        filename: { type: 'string' },
        fileSize: { type: 'number' },
        rows: { type: 'number' },
        columns: { type: 'number' },
        columnNames: { type: 'array', items: { type: 'string' } },
        dataTypes: { type: 'object' },
        missingValues: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  async validateFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PythonValidationResponseDto> {
    if (!file) {
      throw new BadRequestException('Fichier requis');
    }

    try {
      const validationResult =
        await this.analysisContentService.validateFileWithPython(file);
      return validationResult;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      throw new BadRequestException(
        `Erreur lors de la validation: ${errorMessage}`,
      );
    }
  }
}
