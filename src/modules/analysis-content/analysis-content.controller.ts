import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalysisContentService } from './analysis-content.service';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';

@ApiTags('analysis-content')
@Controller('analysis-content')
@UseGuards(JwtAuthGuard)
export class AnalysisContentController {
  private readonly logger = new Logger(AnalysisContentController.name);

  constructor(
    private readonly analysisContentService: AnalysisContentService,
  ) {}

  @Get(':id/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Obtenir le statut d'une analyse",
    description:
      "Récupère le statut actuel d'une analyse (pending, processing, completed, failed)",
  })
  @ApiParam({
    name: 'id',
    description: "Identifiant UUID du contenu d'analyse",
  })
  @ApiResponse({
    status: 200,
    description: "Statut de l'analyse récupéré avec succès",
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: {
          type: 'string',
          enum: ['pending', 'processing', 'completed', 'failed'],
        },
        content: { type: 'string' },
        results: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 404,
    description: "Contenu d'analyse non trouvé",
  })
  async getAnalysisStatus(
    @Param('id', UuidValidationPipe) id: string,
    @Request() req: { user: JwtUser },
  ) {
    this.logger.log(`Récupération du statut de l'analyse ${id}`);

    const analysisContent = await this.analysisContentService.findOne(id);

    return {
      id: analysisContent.id,
      status: analysisContent.status,
      content: analysisContent.content,
      results: analysisContent.results,
    };
  }

  @Get(':id/details')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Obtenir les détails complets d'une analyse",
    description:
      "Récupère tous les détails d'une analyse incluant les résultats, métadonnées et fichiers liés",
  })
  @ApiParam({
    name: 'id',
    description: "Identifiant UUID du contenu d'analyse",
  })
  @ApiResponse({
    status: 200,
    description: "Détails de l'analyse récupérés avec succès",
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        content: { type: 'string' },
        metadata: { type: 'object' },
        status: {
          type: 'string',
          enum: ['pending', 'processing', 'completed', 'failed'],
        },
        results: { type: 'object' },
        linkedFileIds: { type: 'array', items: { type: 'string' } },
        linkedFilesMetadata: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              fileName: { type: 'string' },
              fileSize: { type: 'number' },
              mimeType: { type: 'string' },
              fileType: { type: 'string' },
            },
          },
        },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 404,
    description: "Contenu d'analyse non trouvé",
  })
  async getAnalysisDetails(
    @Param('id', UuidValidationPipe) id: string,
    @Request() req: { user: JwtUser },
  ) {
    this.logger.log(`Récupération des détails de l'analyse ${id}`);

    const analysisContent = await this.analysisContentService.findOne(id);
    const linkedFilesMetadata =
      await this.analysisContentService.getLinkedFilesMetadata(id);

    return {
      id: analysisContent.id,
      title: analysisContent.title,
      content: analysisContent.content,
      metadata: analysisContent.metadata,
      status: analysisContent.status,
      results: analysisContent.results,
      linkedFileIds: analysisContent.linkedFileIds,
      linkedFilesMetadata,
      createdAt: analysisContent.createdAt?.toISOString?.() ?? '',
      updatedAt: analysisContent.updatedAt?.toISOString?.() ?? '',
    };
  }
}
