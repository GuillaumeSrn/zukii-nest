import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TextContent } from './entities/text-content.entity';
import { CreateTextContentDto } from './dto/create-text-content.dto';
import { UpdateTextContentDto } from './dto/update-text-content.dto';
import { TextContentResponseDto } from './dto/text-content-response.dto';
import { TextContentFormat } from './enums/text-content.enum';

@Injectable()
export class TextContentService {
  private readonly logger = new Logger(TextContentService.name);

  constructor(
    @InjectRepository(TextContent)
    private readonly textContentRepository: Repository<TextContent>,
  ) {}

  async create(
    createTextContentDto: CreateTextContentDto,
  ): Promise<TextContent> {
    this.logger.log("Création d'un nouveau contenu textuel");

    const textContent = this.textContentRepository.create({
      ...createTextContentDto,
      formatType: createTextContentDto.formatType || TextContentFormat.PLAIN,
    });

    const savedTextContent = await this.textContentRepository.save(textContent);
    this.logger.log(`Contenu textuel créé avec succès: ${savedTextContent.id}`);

    return savedTextContent;
  }

  async findAll(): Promise<TextContent[]> {
    return this.textContentRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<TextContent> {
    const textContent = await this.textContentRepository.findOne({
      where: { id },
    });

    if (!textContent) {
      throw new NotFoundException('Contenu textuel non trouvé');
    }

    return textContent;
  }

  async update(
    id: string,
    updateTextContentDto: UpdateTextContentDto,
  ): Promise<TextContent> {
    const textContent = await this.findOne(id);

    Object.assign(textContent, updateTextContentDto);

    const updatedTextContent =
      await this.textContentRepository.save(textContent);
    this.logger.log(`Contenu textuel mis à jour avec succès: ${id}`);

    return updatedTextContent;
  }

  async remove(id: string): Promise<void> {
    const result = await this.textContentRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        'Contenu textuel non trouvé ou déjà supprimé',
      );
    }

    this.logger.log(`Contenu textuel supprimé avec succès: ${id}`);
  }

  toResponseDto(textContent: TextContent): TextContentResponseDto {
    return {
      id: textContent.id,
      content: textContent.content,
      formatType: textContent.formatType as TextContentFormat,
      createdAt: textContent.createdAt,
      updatedAt: textContent.updatedAt,
    };
  }
}
