import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileContent } from './entities/file-content.entity';
import { CreateFileContentDto } from './dto/create-file-content.dto';
import { UpdateFileContentDto } from './dto/update-file-content.dto';
import { FileType } from './enums/file-content.enum';
import * as crypto from 'crypto';

@Injectable()
export class FileContentService {
  private readonly logger = new Logger(FileContentService.name);

  constructor(
    @InjectRepository(FileContent)
    private readonly fileContentRepository: Repository<FileContent>,
  ) {}

  async create(
    createFileContentDto: CreateFileContentDto,
    uploadedBy: string,
  ): Promise<FileContent> {
    this.logger.log("Création d'un nouveau fichier");

    // Valider le hash MD5
    const calculatedHash = this.calculateMD5(createFileContentDto.base64Data);
    if (calculatedHash !== createFileContentDto.md5Hash) {
      throw new BadRequestException(
        'Le hash MD5 ne correspond pas au contenu du fichier',
      );
    }

    const fileContent = this.fileContentRepository.create({
      ...createFileContentDto,
      uploadedBy,
      fileType: createFileContentDto.fileType || FileType.CSV,
    });

    const savedFileContent = await this.fileContentRepository.save(fileContent);
    this.logger.log(`Fichier créé avec succès: ${savedFileContent.id}`);

    return savedFileContent;
  }

  async uploadFile(
    fileName: string,
    mimeType: string,
    base64Data: string,
    uploadedBy: string,
  ): Promise<FileContent> {
    this.logger.log(`Upload du fichier: ${fileName}`);

    const cleanBase64 = this.cleanBase64Data(base64Data);
    const fileSize = this.calculateFileSize(cleanBase64);
    const md5Hash = this.calculateMD5(cleanBase64);
    const fileType = this.determineFileType(mimeType, fileName);

    const createDto: CreateFileContentDto = {
      fileName,
      mimeType,
      fileSize,
      base64Data: cleanBase64,
      md5Hash,
      fileType,
    };

    return this.create(createDto, uploadedBy);
  }

  async findAll(): Promise<FileContent[]> {
    return this.fileContentRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<FileContent> {
    const fileContent = await this.fileContentRepository.findOne({
      where: { id },
    });

    if (!fileContent) {
      throw new NotFoundException('Fichier non trouvé');
    }

    return fileContent;
  }

  async downloadFile(
    id: string,
  ): Promise<{ content: Buffer; fileContent: FileContent }> {
    const fileContent = await this.findOne(id);
    const content = Buffer.from(fileContent.base64Data, 'base64');

    return { content, fileContent };
  }

  async update(
    id: string,
    updateFileContentDto: UpdateFileContentDto,
  ): Promise<FileContent> {
    const fileContent = await this.findOne(id);

    // Créer une copie des données à mettre à jour pour éviter la mutation du DTO
    const updateData = { ...updateFileContentDto };

    // Si on met à jour les données, recalculer le hash et la taille
    if (updateData.base64Data) {
      updateData.md5Hash = this.calculateMD5(updateData.base64Data);
      updateData.fileSize = this.calculateFileSize(updateData.base64Data);
    }

    Object.assign(fileContent, updateData);

    const updatedFileContent =
      await this.fileContentRepository.save(fileContent);
    this.logger.log(`Fichier mis à jour avec succès: ${id}`);

    return updatedFileContent;
  }

  async remove(id: string): Promise<void> {
    const result = await this.fileContentRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Fichier non trouvé ou déjà supprimé');
    }

    this.logger.log(`Fichier supprimé avec succès: ${id}`);
  }

  private calculateMD5(data: string): string {
    return crypto.createHash('md5').update(data, 'base64').digest('hex');
  }

  private cleanBase64Data(base64Data: string): string {
    return base64Data.replace(/^data:[^;]+;base64,/, '');
  }

  private calculateFileSize(cleanBase64: string): number {
    return Math.round((cleanBase64.length * 3) / 4);
  }

  private determineFileType(mimeType: string, fileName: string): FileType {
    if (mimeType.includes('csv') || fileName.toLowerCase().endsWith('.csv')) {
      return FileType.CSV;
    }
    if (
      mimeType.includes('excel') ||
      fileName.toLowerCase().match(/\.(xlsx?|xls)$/)
    ) {
      return FileType.EXCEL;
    }
    if (mimeType.includes('json') || fileName.toLowerCase().endsWith('.json')) {
      return FileType.JSON;
    }
    return FileType.CSV; // Par défaut
  }
} 