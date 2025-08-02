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
import axios, { AxiosError } from 'axios';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FormData = require('form-data');
import {
  PythonAnalysisResponseDto,
  PythonValidationResponseDto,
} from './dto/python-analysis-response.dto';

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
    private readonly fileContentService: FileContentService,
  ) {}

  async create(
    createAnalysisContentDto: CreateAnalysisContentDto,
  ): Promise<AnalysisContent> {
    this.logger.log("Création d'un nouveau contenu d'analyse");

    const analysisContent = this.analysisContentRepository.create({
      ...createAnalysisContentDto,
    });

    const savedAnalysisContent =
      await this.analysisContentRepository.save(analysisContent);
    this.logger.log(
      `Contenu d'analyse créé avec succès: ${savedAnalysisContent.id}`,
    );

    return savedAnalysisContent;
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

    for (const fileId of analysisContent.linkedFileIds) {
      try {
        const fileContent = await this.fileContentService.findOne(fileId);
        filesMetadata.push({
          id: fileContent.id,
          fileName: fileContent.fileName,
          fileSize: fileContent.fileSize,
          mimeType: fileContent.mimeType,
          fileType: fileContent.fileType,
        });
      } catch {
        this.logger.warn(`Fichier ${fileId} non trouvé pour l'analyse ${id}`);
        // Continuer avec les autres fichiers
      }
    }

    return filesMetadata;
  }

  async analyzeFileWithPython(
    file: Express.Multer.File,
    question: string,
    options: AnalysisOptions = {},
  ): Promise<PythonAnalysisResponseDto> {
    try {
      const formData = new (FormData as any)();
      (formData as any).append('file', file.buffer, file.originalname);
      (formData as any).append('question', question);
      (formData as any).append('analysis_type', options.analysisType || 'general');
      (formData as any).append(
        'include_charts',
        String(options.includeCharts !== false),
      );
      (formData as any).append(
        'anonymize_data',
        String(options.anonymizeData !== false),
      );
      if (options.conversationId) {
        (formData as any).append('conversation_id', options.conversationId);
      }

      const response = await axios.post(
        `${this.pythonServiceUrl}/analyze`,
        formData,
        {
          headers: (formData as any).getHeaders(),
          maxContentLength: 50 * 1024 * 1024, // 50MB
          timeout: 300000, // 5 min
        },
      );
      return response.data as PythonAnalysisResponseDto;
    } catch (error) {
      this.logger.error('Erreur appel micro-service Python:', error);
      const axiosError = error as AxiosError;
      throw new HttpException(
        (axiosError.response?.data as { message?: string })?.message ||
          'Erreur analyse IA',
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async analyzeMultipleFilesWithPython(
    files: Express.Multer.File[],
    question: string,
    options: AnalysisOptions = {},
  ): Promise<PythonAnalysisResponseDto> {
    try {
      const formData = new (FormData as any)();
      files.forEach((file, idx) => {
        (formData as any).append(
          'files',
          file.buffer,
          file.originalname || `file${idx}.csv`,
        );
      });
      (formData as any).append('question', question);
      (formData as any).append('analysis_type', options.analysisType || 'general');
      (formData as any).append(
        'include_charts',
        String(options.includeCharts !== false),
      );
      (formData as any).append(
        'anonymize_data',
        String(options.anonymizeData !== false),
      );
      if (options.conversationId) {
        (formData as any).append('conversation_id', options.conversationId);
      }

      const response = await axios.post(
        `${this.pythonServiceUrl}/analyze/batch`,
        formData,
        {
          headers: (formData as any).getHeaders(),
          maxContentLength: 10 * 50 * 1024 * 1024, // 10 fichiers de 50MB
          timeout: 600000, // 10 min
        },
      );
      return response.data as PythonAnalysisResponseDto;
    } catch (error) {
      this.logger.error('Erreur appel batch micro-service Python:', error);
      const axiosError = error as AxiosError;
      throw new HttpException(
        (axiosError.response?.data as { message?: string })?.message ||
          'Erreur analyse batch IA',
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async validateFileWithPython(
    file: Express.Multer.File,
  ): Promise<PythonValidationResponseDto> {
    try {
      const formData = new (FormData as any)();
      (formData as any).append('file', file.buffer, file.originalname);

      const response = await axios.post(
        `${this.pythonServiceUrl}/validate`,
        formData,
        {
          headers: (formData as any).getHeaders(),
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
