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
import { BoardMembersService } from '../board-members/board-members.service';
import { TextContentService } from '../text-content/text-content.service';
import { FileContentService } from '../file-content/file-content.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto, UpdateBlockPositionDto } from './dto/update-block.dto';
import { BoardMemberPermission } from '../board-members/enums/board-member.enum';
import { BlockType } from './enums/block.enum';

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
    private readonly boardMembersService: BoardMembersService,
    private readonly textContentService: TextContentService,
    private readonly fileContentService: FileContentService,
  ) {}

  async create(
    boardId: string,
    createBlockDto: CreateBlockDto,
    currentUserId: string,
  ): Promise<Block> {
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
      where: { category: 'block', name: 'active', isActive: true },
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

    return this.blockRepository.findOne({
      where: { id: savedBlock.id },
      relations: ['status'],
    }) as Promise<Block>;
  }

  async findByBoard(boardId: string, currentUserId: string): Promise<Block[]> {
    this.logger.log(
      `Récupération des blocks du board ${boardId} par l'utilisateur ${currentUserId}`,
    );

    await this.validateUserPermission(
      boardId,
      currentUserId,
      BoardMemberPermission.VIEW,
    );

    return this.blockRepository.find({
      where: { boardId, status: { isActive: true } },
      relations: ['status'],
      order: { zIndex: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(blockId: string, currentUserId: string): Promise<Block> {
    const block = await this.blockRepository.findOne({
      where: { id: blockId },
      relations: ['status'],
    });

    if (!block) {
      throw new NotFoundException('Block non trouvé');
    }

    await this.validateUserPermission(
      block.boardId,
      currentUserId,
      BoardMemberPermission.VIEW,
    );

    return block;
  }

  async update(
    blockId: string,
    updateBlockDto: UpdateBlockDto,
    currentUserId: string,
  ): Promise<Block> {
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

    return updatedBlock;
  }

  async updatePosition(
    blockId: string,
    positionDto: UpdateBlockPositionDto,
    currentUserId: string,
  ): Promise<Block> {
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

    return this.blockRepository.save(block);
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

    const result = await this.blockRepository.delete(blockId);

    if (result.affected === 0) {
      throw new NotFoundException('Block non trouvé ou déjà supprimé');
    }

    this.logger.log(`Block supprimé avec succès: ${blockId}`);
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
          // TODO: Implémenter la validation pour AnalysisContent quand le module sera créé
          throw new BadRequestException(
            "Le type ANALYSIS n'est pas encore supporté",
          );
        default:
          throw new BadRequestException(`Type de block invalide: ${blockType}`);
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
}
