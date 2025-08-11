import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from './entities/block.entity';
import { Board } from '../boards/entities/board.entity';
import { Status } from '../status/entities/status.entity';
import { User } from '../users/entities/user.entity';
import { BoardMembersService } from '../board-members/board-members.service';
import { TextContentService } from '../text-content/text-content.service';
import { FileContentService } from '../file-content/file-content.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto, UpdateBlockPositionDto } from './dto/update-block.dto';
import { BlockResponseDto } from './dto/block-response.dto';
import { BoardMemberPermission } from '../board-members/enums/board-member.enum';
import { BlockType } from './enums/block.enum';
import { AnalysisContentService } from '../analysis-content/analysis-content.service';

@Injectable()
export class BlocksService {
  private readonly logger = new Logger(BlocksService.name);

  constructor(
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Status)
    private readonly statusRepository: Repository<Status>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly boardMembersService: BoardMembersService,
    private readonly textContentService: TextContentService,
    private readonly fileContentService: FileContentService,
    private readonly analysisContentService: AnalysisContentService,
  ) {}

  async create(
    boardId: string,
    createBlockDto: CreateBlockDto,
    currentUserId: string,
  ): Promise<BlockResponseDto> {
    this.logger.log(
      `Création d'un block dans le board ${boardId} par l'utilisateur ${currentUserId}`,
    );

    this.validatePositionAndDimensions(createBlockDto);
    await this.validateContentExists(
      createBlockDto.contentId,
      createBlockDto.blockType,
    );

    await this.findBoardEntity(boardId);
    await this.validateUserPermission(
      boardId,
      currentUserId,
      BoardMemberPermission.EDIT,
    );

    const defaultStatus = await this.statusRepository.findOne({
      where: { id: 'block-active', isActive: true },
    });

    if (!defaultStatus) {
      throw new ConflictException('Statut par défaut non disponible');
    }

    const block = this.blockRepository.create({
      ...createBlockDto,
      boardId,
      createdBy: currentUserId,
      statusId: defaultStatus.id,
      lastModifiedBy: currentUserId,
      width: createBlockDto.width || 300,
      height: createBlockDto.height || 200,
      zIndex: createBlockDto.zIndex || 0,
    });

    const savedBlock = await this.blockRepository.save(block);
    this.logger.log(`Block créé avec succès: ${savedBlock.id}`);

    // Ne plus déclencher d'analyse ici pour éviter de bloquer la réponse HTTP.
    // L'analyse est désormais lancée en arrière-plan par le controller.

    // Récupérer le block avec les relations pour le mapping DTO
    const blockWithRelations = await this.blockRepository.findOne({
      where: { id: savedBlock.id },
      relations: ['status', 'lastModifier'],
    });

    return this.toBlockResponseDto(blockWithRelations!);
  }

  async findByBoard(
    boardId: string,
    currentUserId: string,
  ): Promise<BlockResponseDto[]> {
    this.logger.log(
      `Récupération des blocks du board ${boardId} par l'utilisateur ${currentUserId}`,
    );

    // 1. D'abord vérifier que le board existe (404 si inexistant)
    await this.findBoardEntity(boardId);

    // 2. Ensuite vérifier les permissions (403 si pas autorisé)
    await this.validateUserPermission(
      boardId,
      currentUserId,
      BoardMemberPermission.VIEW,
    );

    const blocks = await this.blockRepository.find({
      where: { boardId, status: { isActive: true } },
      relations: ['status', 'lastModifier'],
      order: { zIndex: 'ASC', createdAt: 'ASC' },
    });

    return blocks.map((block) => this.toBlockResponseDto(block));
  }

  async findOne(
    blockId: string,
    currentUserId: string,
  ): Promise<BlockResponseDto> {
    const block = await this.blockRepository.findOne({
      where: { id: blockId },
      relations: ['status', 'lastModifier'],
    });

    if (!block) {
      throw new NotFoundException('Block non trouvé');
    }

    await this.validateUserPermission(
      block.boardId,
      currentUserId,
      BoardMemberPermission.VIEW,
    );

    return this.toBlockResponseDto(block);
  }

  async update(
    blockId: string,
    updateBlockDto: UpdateBlockDto,
    currentUserId: string,
  ): Promise<BlockResponseDto> {
    this.logger.log(
      `Mise à jour du block ${blockId} par l'utilisateur ${currentUserId}`,
    );

    if (
      updateBlockDto.positionX !== undefined ||
      updateBlockDto.positionY !== undefined
    ) {
      this.validatePositionAndDimensions(updateBlockDto);
    }

    const block = await this.findBlockEntity(blockId);
    await this.validateUserPermission(
      block.boardId,
      currentUserId,
      BoardMemberPermission.EDIT,
    );

    Object.assign(block, updateBlockDto);
    block.lastModifiedBy = currentUserId;

    const updatedBlock = await this.blockRepository.save(block);
    this.logger.log(`Block mis à jour avec succès: ${blockId}`);

    // Récupérer avec relations pour le DTO
    const blockWithRelations = await this.blockRepository.findOne({
      where: { id: updatedBlock.id },
      relations: ['status', 'lastModifier'],
    });

    return this.toBlockResponseDto(blockWithRelations!);
  }

  async updatePosition(
    blockId: string,
    positionDto: UpdateBlockPositionDto,
    currentUserId: string,
  ): Promise<BlockResponseDto> {
    this.logger.log(`Mise à jour de la position du block ${blockId}`);

    this.validatePositionAndDimensions(positionDto);

    const block = await this.findBlockEntity(blockId);
    await this.validateUserPermission(
      block.boardId,
      currentUserId,
      BoardMemberPermission.EDIT,
    );

    Object.assign(block, positionDto);
    block.lastModifiedBy = currentUserId;

    const updatedBlock = await this.blockRepository.save(block);

    // Récupérer avec relations pour le DTO
    const blockWithRelations = await this.blockRepository.findOne({
      where: { id: updatedBlock.id },
      relations: ['status', 'lastModifier'],
    });

    return this.toBlockResponseDto(blockWithRelations!);
  }

  async remove(blockId: string, currentUserId: string): Promise<void> {
    this.logger.log(
      `Suppression du block ${blockId} par l'utilisateur ${currentUserId}`,
    );

    const block = await this.findBlockEntity(blockId);
    await this.validateUserPermission(
      block.boardId,
      currentUserId,
      BoardMemberPermission.EDIT,
    );

    // Stocker le superBlockId pour vérification ultérieure
    const superBlockId = block.superBlockId;

    // ✅ Suppression manuelle du contenu associé
    try {
      switch (block.blockType) {
        case BlockType.TEXT:
          await this.textContentService.remove(block.contentId);
          break;
        case BlockType.FILE:
          await this.fileContentService.remove(block.contentId);
          break;
        case BlockType.ANALYSIS:
          await this.analysisContentService.remove(block.contentId);
          break;
      }
    } catch (error) {
      // Continue même si la suppression du contenu échoue
      this.logger.warn(
        `Erreur lors de la suppression du contenu ${block.contentId}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
    }

    // Supprimer le block (les BlockRelations seront supprimées par CASCADE)
    const result = await this.blockRepository.delete(blockId);

    if (result.affected === 0) {
      throw new NotFoundException('Block non trouvé ou déjà supprimé');
    }

    // 🆕 Logique de nettoyage automatique des super-blocks
    if (superBlockId) {
      await this.cleanupEmptySuperBlock(superBlockId);
    }

    this.logger.log(`Block et son contenu supprimés avec succès: ${blockId}`);
  }

  /**
   * 🆕 Vérifie et supprime automatiquement les super-blocks vides ou avec un seul block
   */
  private async cleanupEmptySuperBlock(superBlockId: string): Promise<void> {
    try {
      // Compter les blocks restants dans ce super-block
      const remainingBlocksCount = await this.blockRepository.count({
        where: {
          superBlockId,
          status: { isActive: true },
        },
      });

      this.logger.log(
        `Super-block ${superBlockId} contient ${remainingBlocksCount} block(s) restant(s)`,
      );

      // Supprimer le super-block s'il est vide OU s'il ne contient qu'un seul block
      if (remainingBlocksCount <= 1) {
        // Si il reste 1 block, le détacher d'abord du super-block
        if (remainingBlocksCount === 1) {
          await this.blockRepository.update(
            { superBlockId },
            { superBlockId: undefined },
          );
          this.logger.log(
            `Block restant détaché du super-block ${superBlockId}`,
          );
        }

        // Supprimer le super-block devenu inutile
        await this.blockRepository.manager.query(
          'DELETE FROM super_blocks WHERE id = $1',
          [superBlockId],
        );

        this.logger.log(
          `Super-block ${superBlockId} supprimé automatiquement (${remainingBlocksCount === 0 ? 'vide' : 'un seul block'})`,
        );
      }
    } catch (error) {
      // Ne pas faire échouer la suppression du block si le nettoyage échoue
      this.logger.warn(
        `Erreur lors du nettoyage du super-block ${superBlockId}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
    }
  }

  private async validateContentExists(
    contentId: string,
    blockType: BlockType,
  ): Promise<void> {
    this.logger.log(
      `Validation du contenu ${contentId} pour le type ${blockType}`,
    );

    try {
      switch (blockType) {
        case BlockType.TEXT:
          await this.textContentService.findOne(contentId);
          break;
        case BlockType.FILE:
          await this.fileContentService.findOne(contentId);
          break;
        case BlockType.ANALYSIS:
          await this.analysisContentService.findOne(contentId);
          break;
        default:
          throw new BadRequestException(
            `Type de block invalide: ${blockType ? blockType : 'unknown'}`,
          );
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException(
          `Le contenu ${contentId} de type ${blockType} n'existe pas`,
        );
      }
      throw error;
    }
  }

  private async findBoardEntity(id: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { id },
    });

    if (!board) {
      throw new NotFoundException('Board non trouvé');
    }

    return board;
  }

  private async findBlockEntity(id: string): Promise<Block> {
    const block = await this.blockRepository.findOne({
      where: { id },
      relations: ['status'],
    });

    if (!block) {
      throw new NotFoundException('Block non trouvé');
    }

    return block;
  }

  private async validateUserPermission(
    boardId: string,
    userId: string,
    requiredPermission: BoardMemberPermission,
  ): Promise<void> {
    const hasPermission = await this.boardMembersService.checkUserPermission(
      boardId,
      userId,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        "Vous n'avez pas les permissions nécessaires",
      );
    }
  }

  private validatePositionAndDimensions(
    dto: Partial<CreateBlockDto | UpdateBlockDto | UpdateBlockPositionDto>,
  ): void {
    if (dto.positionX !== undefined && dto.positionX < 0) {
      throw new BadRequestException(
        'La position X doit être positive ou nulle',
      );
    }

    if (dto.positionY !== undefined && dto.positionY < 0) {
      throw new BadRequestException(
        'La position Y doit être positive ou nulle',
      );
    }

    if ('width' in dto && dto.width !== undefined && dto.width <= 0) {
      throw new BadRequestException('La largeur doit être supérieure à 0');
    }

    if ('height' in dto && dto.height !== undefined && dto.height <= 0) {
      throw new BadRequestException('La hauteur doit être supérieure à 0');
    }
  }

  private toBlockResponseDto(block: Block): BlockResponseDto {
    return {
      id: block.id,
      boardId: block.boardId,
      blockType: block.blockType,
      title: block.title,
      positionX: block.positionX,
      positionY: block.positionY,
      width: block.width,
      height: block.height,
      zIndex: block.zIndex,
      contentId: block.contentId,
      superBlockId: block.superBlockId,
      zoneType: block.zoneType,
      status: {
        id: block.status.id,
        category: block.status.category,
        name: block.status.name,
        isActive: block.status.isActive,
      },
      lastModifiedByUser: block.lastModifier
        ? {
            id: block.lastModifier.id,
            displayName: block.lastModifier.displayName,
            isActive: true, // Simplification
          }
        : undefined,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
    };
  }

  private async triggerAnalysisAsync(
    blockId: string,
    contentId: string,
    linkedFiles: Array<{
      id: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      fileType: string;
    }>,
  ): Promise<void> {
    try {
      this.logger.log(
        `Démarrage de l'analyse asynchrone pour le block ${blockId}`,
      );

      // Récupérer les fichiers depuis le stockage et créer des objets Express.Multer.File
      const files: Express.Multer.File[] = [];
      for (const fileMetadata of linkedFiles) {
        const fileContent = await this.fileContentService.findOne(
          fileMetadata.id,
        );
        if (fileContent) {
          files.push({
            fieldname: 'file',
            originalname: fileMetadata.fileName,
            encoding: '7bit',
            mimetype: fileMetadata.mimeType,
            size: fileMetadata.fileSize,
            destination: '',
            filename: fileMetadata.fileName,
            path: '',
            buffer: Buffer.from(fileContent.base64Data, 'base64'),
            stream: null as unknown,
          } as Express.Multer.File);
        }
      }

      if (files.length === 0) {
        this.logger.warn(
          `Aucun fichier trouvé pour l'analyse du block ${blockId}`,
        );
        return;
      }

      // Appeler le service d'analyse Python
      const analysisResult =
        await this.analysisContentService.analyzeFilesWithPython(
          files,
          'Analyse automatique des données',
        );

      // Mettre à jour le contenu d'analyse avec les résultats
      await this.analysisContentService.update(contentId, {
        results: analysisResult as unknown as Record<string, unknown>,
        status: 'completed',
      });

      this.logger.log(`Analyse terminée avec succès pour le block ${blockId}`);
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'analyse asynchrone du block ${blockId}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );

      // Mettre à jour le statut en cas d'erreur
      try {
        await this.analysisContentService.update(contentId, {
          results: {
            error: "Erreur lors de l'analyse",
            message: error instanceof Error ? error.message : 'Erreur inconnue',
          },
          status: 'failed',
        });
      } catch (updateError) {
        this.logger.error(
          `Impossible de mettre à jour le statut d'erreur: ${updateError instanceof Error ? updateError.message : 'Erreur inconnue'}`,
        );
      }
    }
  }
}
