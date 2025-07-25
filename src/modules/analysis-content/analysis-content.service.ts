import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalysisContent } from './entities/analysis-content.entity';
import { CreateAnalysisContentDto } from './dto/create-analysis-content.dto';
import { UpdateAnalysisContentDto } from './dto/update-analysis-content.dto';
import { FileContentService } from '../file-content/file-content.service';

@Injectable()
export class AnalysisContentService {
  private readonly logger = new Logger(AnalysisContentService.name);

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
}
