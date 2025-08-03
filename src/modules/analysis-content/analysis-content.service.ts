import {
  Injectable,
  NotFoundException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalysisContent } from './entities/analysis-content.entity';
import { CreateAnalysisContentDto } from './dto/create-analysis-content.dto';
import { UpdateAnalysisContentDto } from './dto/update-analysis-content.dto';
import { FileContentService } from '../file-content/file-content.service';
import { Block } from '../blocks/entities/block.entity';
import { BlockType } from '../blocks/enums/block.enum';
import axios, { AxiosError } from 'axios';
import * as FormData from 'form-data';

interface PythonAnalysisResponse {
  analysis_id: string;
  summary: string;
  insights: unknown[];
  charts: unknown[];
  metrics: Record<string, unknown>;
  anonymization_report: Record<string, unknown>;
  processing_time: number;
}

interface PythonErrorResponse {
  url?: string;
  body?: PythonAnalysisResponse;
  message?: string;
}

interface FormDataWithHeaders extends FormData {
  getHeaders(): Record<string, string>;
}

import { PythonValidationResponseDto } from './dto/python-analysis-response.dto';

interface AnalysisOptions {
  analysisType?: string;
  includeCharts?: boolean;
  anonymizeData?: boolean;
  conversationId?: string;
}

@Injectable()
export class AnalysisContentService {
  private readonly logger = new Logger(AnalysisContentService.name);
  private readonly pythonServiceUrl =
    process.env.PYTHON_SERVICE_URL || 'http://localhost:8000/api/v1';

  constructor(
    @InjectRepository(AnalysisContent)
    private readonly analysisContentRepository: Repository<AnalysisContent>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    private readonly fileContentService: FileContentService,
  ) {}

  async create(
    createAnalysisContentDto: CreateAnalysisContentDto,
  ): Promise<AnalysisContent> {
    this.logger.log("Création d'un nouveau contenu d'analyse");

    const analysisContent = this.analysisContentRepository.create({
      ...createAnalysisContentDto,
      status: 'pending', // Statut initial
    });

    const savedAnalysisContent =
      await this.analysisContentRepository.save(analysisContent);
    this.logger.log(
      `Contenu d'analyse créé avec succès: ${savedAnalysisContent.id}`,
    );

    return savedAnalysisContent;
  }

  async startAnalysisInBackground(
    analysisContentId: string,
    question: string,
    options: AnalysisOptions = {},
  ): Promise<void> {
    this.logger.log(`Démarrage de l'analyse en arrière-plan: ${analysisContentId}`);

    // Mettre à jour le statut à "processing"
    await this.update(analysisContentId, { status: 'processing' });

    // Lancer l'analyse en arrière-plan (non-bloquant)
    setImmediate(async () => {
      try {
        // Récupérer les fichiers liés
        const analysisContent = await this.findOne(analysisContentId);
        if (!analysisContent.linkedFileIds || analysisContent.linkedFileIds.length === 0) {
          throw new Error('Aucun fichier lié à analyser');
        }

        // Récupérer les fichiers depuis le service
        const fileContents = await Promise.all(
          analysisContent.linkedFileIds.map(async fileId => {
            try {
              // Essayer d'abord de récupérer directement comme FileContent
              return await this.fileContentService.findOne(fileId);
            } catch (error) {
              this.logger.warn(`FileContent ${fileId} non trouvé, tentative de récupération via block`);
              // Si ça échoue, essayer de récupérer via le block (fileId pourrait être l'ID du block)
              const block = await this.blockRepository.findOne({
                where: { id: fileId, blockType: BlockType.FILE }
              });
              if (block && block.contentId) {
                return await this.fileContentService.findOne(block.contentId);
              }
              throw new NotFoundException(`Fichier non trouvé: ${fileId}`);
            }
          })
        );

        // Convertir en format attendu par analyzeFilesWithPython
        const files = fileContents.map(fileContent => ({
          originalname: fileContent.fileName,
          mimetype: fileContent.mimeType,
          buffer: Buffer.from(fileContent.base64Data, 'base64'),
          fieldname: 'file',
          encoding: '7bit',
          size: fileContent.fileSize,
          stream: null as any,
          destination: '',
          filename: fileContent.fileName,
          path: '',
        }));

        // Lancer l'analyse Python
        const result = await this.analyzeFilesWithPython(files, question, options);

        // Mettre à jour avec les résultats
        await this.update(analysisContentId, {
          status: 'completed',
          results: result as unknown as Record<string, unknown>,
          content: result.summary || 'Analyse terminée',
        });

        this.logger.log(`Analyse terminée avec succès: ${analysisContentId}`);
      } catch (error) {
        this.logger.error(`Erreur lors de l'analyse: ${analysisContentId}`, error);
        
        // Mettre à jour le statut à "failed"
        await this.update(analysisContentId, {
          status: 'failed',
          content: `Erreur d'analyse: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        });
      }
    });
  }

  async findAll(): Promise<AnalysisContent[]> {
    this.logger.log("Récupération de tous les contenus d'analyse");

    return this.analysisContentRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AnalysisContent> {
    this.logger.log(`Récupération du contenu d'analyse ${id}`);

    const analysisContent = await this.analysisContentRepository.findOne({
      where: { id },
    });

    if (!analysisContent) {
      throw new NotFoundException("Contenu d'analyse non trouvé");
    }

    return analysisContent;
  }

  async findByIds(ids: string[]): Promise<AnalysisContent[]> {
    this.logger.log(`Récupération de ${ids.length} contenus d'analyse`);

    if (ids.length === 0) {
      return [];
    }

    const analysisContents = await this.analysisContentRepository
      .createQueryBuilder('analysisContent')
      .where('analysisContent.id IN (:...ids)', { ids })
      .orderBy('analysisContent.createdAt', 'DESC')
      .getMany();

    this.logger.log(`${analysisContents.length} contenus d'analyse trouvés`);
    return analysisContents;
  }

  async update(
    id: string,
    updateAnalysisContentDto: UpdateAnalysisContentDto,
  ): Promise<AnalysisContent> {
    this.logger.log(`Mise à jour du contenu d'analyse ${id}`);

    const analysisContent = await this.findOne(id);

    Object.assign(analysisContent, updateAnalysisContentDto);

    const updatedAnalysisContent =
      await this.analysisContentRepository.save(analysisContent);
    this.logger.log(
      `Contenu d'analyse mis à jour avec succès: ${updatedAnalysisContent.id}`,
    );

    return updatedAnalysisContent;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Suppression du contenu d'analyse ${id}`);

    const analysisContent = await this.findOne(id);
    await this.analysisContentRepository.remove(analysisContent);

    this.logger.log(`Contenu d'analyse supprimé avec succès: ${id}`);
  }

  /**
   * Récupère les métadonnées des fichiers liés à une analyse
   */
  async getLinkedFilesMetadata(id: string): Promise<
    Array<{
      id: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      fileType: string;
    }>
  > {
    this.logger.log(
      `Récupération des métadonnées des fichiers liés à l'analyse ${id}`,
    );

    const analysisContent = await this.findOne(id);

    if (
      !analysisContent.linkedFileIds ||
      analysisContent.linkedFileIds.length === 0
    ) {
      return [];
    }

    // Récupérer les métadonnées des fichiers liés
    const filesMetadata: Array<{
      id: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      fileType: string;
    }> = [];

    for (const fileBlockId of analysisContent.linkedFileIds) {
      try {
        // Récupérer le block de fichier pour obtenir son contentId
        const fileBlock = await this.blockRepository.findOne({
          where: { id: fileBlockId }
        });
        
        if (fileBlock && fileBlock.contentId) {
          // Récupérer le contenu du fichier
          const fileContent = await this.fileContentService.findOne(fileBlock.contentId);
          filesMetadata.push({
            id: fileContent.id,
            fileName: fileContent.fileName,
            fileSize: fileContent.fileSize,
            mimeType: fileContent.mimeType,
            fileType: fileContent.fileType,
          });
        }
      } catch (error) {
        this.logger.warn(`Block de fichier ${fileBlockId} non trouvé pour l'analyse ${id}: ${error.message}`);
        // Continuer avec les autres fichiers
      }
    }

    return filesMetadata;
  }

  async analyzeFilesWithPython(
    files: Express.Multer.File | Express.Multer.File[],
    question: string,
    options: AnalysisOptions = {},
  ): Promise<PythonAnalysisResponse> {
    try {
      const formData = new FormData() as FormDataWithHeaders;

      // Normaliser les fichiers en array
      const filesArray = Array.isArray(files) ? files : [files];

      // Ajouter tous les fichiers
      filesArray.forEach((file, idx) => {
        formData.append(
          'files',
          file.buffer,
          file.originalname || `file${idx}.csv`,
        );
      });

      formData.append('question', question);
      formData.append('analysis_type', options.analysisType || 'general');
      formData.append(
        'include_charts',
        String(options.includeCharts !== false),
      );
      formData.append(
        'anonymize_data',
        String(options.anonymizeData !== false),
      );
      if (options.conversationId) {
        formData.append('conversation_id', options.conversationId);
      }

      const response = await axios.post(
        `${this.pythonServiceUrl}/analyze`,
        formData,
        {
          headers: formData.getHeaders(),
          maxContentLength: filesArray.length * 50 * 1024 * 1024, // N fichiers de 50MB
          timeout: filesArray.length > 1 ? 600000 : 300000, // 10 min pour multiple, 5 min pour single
        },
      );

      // Retourner directement la réponse du service Python sans validation stricte
      return response.data as PythonAnalysisResponse;
    } catch (error) {
      this.logger.error('Erreur appel micro-service Python:', error);
      const axiosError = error as AxiosError;

      // Si c'est une erreur de validation Pydantic, on retourne quand même la réponse
      if (axiosError.response?.status === 500 && axiosError.response?.data) {
        const errorData = axiosError.response.data as PythonErrorResponse;
        if (errorData.url && errorData.url.includes('pydantic.dev')) {
          this.logger.warn(
            'Erreur de validation Pydantic détectée, retour de la réponse brute',
          );
          // Essayer d'extraire la réponse de l'erreur
          if (errorData.body && errorData.body.analysis_id) {
            return errorData.body;
          }
        }
      }

      throw new HttpException(
        (axiosError.response?.data as { message?: string })?.message ||
          'Erreur analyse IA',
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async validateFileWithPython(
    file: Express.Multer.File,
  ): Promise<PythonValidationResponseDto> {
    try {
      const formData = new FormData() as FormDataWithHeaders;
      formData.append('file', file.buffer, file.originalname);

      const response = await axios.post(
        `${this.pythonServiceUrl}/validate`,
        formData,
        {
          headers: formData.getHeaders(),
          maxContentLength: 50 * 1024 * 1024,
          timeout: 60000,
        },
      );
      return response.data as PythonValidationResponseDto;
    } catch (error) {
      this.logger.error('Erreur validation fichier Python:', error);
      const axiosError = error as AxiosError;
      throw new HttpException(
        (axiosError.response?.data as { message?: string })?.message ||
          'Erreur validation fichier',
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
