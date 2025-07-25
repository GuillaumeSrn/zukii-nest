import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SuperBlock } from './entities/super-block.entity';
import { CreateSuperBlockDto } from './dto/create-super-block.dto';
import { UpdateSuperBlockDto } from './dto/update-super-block.dto';
import { SuperBlockResponseDto } from './dto/super-block-response.dto';
import { Board } from '../boards/entities/board.entity';
import { User } from '../users/entities/user.entity';
import { BoardMembersService } from '../board-members/board-members.service';
import { BoardMemberPermission } from '../board-members/enums/board-member.enum';

@Injectable()
export class SuperBlocksService {
  private readonly logger = new Logger(SuperBlocksService.name);

  constructor(
    @InjectRepository(SuperBlock)
    private readonly superBlockRepository: Repository<SuperBlock>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly boardMembersService: BoardMembersService,
  ) {}

  async create(
    boardId: string,
    createSuperBlockDto: CreateSuperBlockDto,
    currentUserId: string,
  ): Promise<SuperBlockResponseDto> {
    this.logger.log(
      `Création d'un super-block dans le board ${boardId} par l'utilisateur ${currentUserId}`,
    );

    // Vérifier que le board existe et que l'utilisateur a les permissions
    await this.findBoardEntity(boardId);
    await this.validateUserPermission(
      boardId,
      currentUserId,
      BoardMemberPermission.EDIT,
    );

    const superBlock = this.superBlockRepository.create({
      ...createSuperBlockDto,
      boardId,
      createdBy: currentUserId,
      color: createSuperBlockDto.color || '#6366f1',
      collapsed: createSuperBlockDto.collapsed || false,
      displayOrder: createSuperBlockDto.displayOrder || 0,
    });

    const savedSuperBlock = await this.superBlockRepository.save(superBlock);
    this.logger.log(`Super-block ${savedSuperBlock.id} créé avec succès`);

    return this.mapToResponseDto(savedSuperBlock);
  }

  async findByBoard(
    boardId: string,
    currentUserId: string,
  ): Promise<SuperBlockResponseDto[]> {
    this.logger.log(
      `Récupération des super-blocks du board ${boardId} par l'utilisateur ${currentUserId}`,
    );

    // 1. D'abord vérifier que le board existe (404 si inexistant)
    await this.findBoardEntity(boardId);

    // 2. Ensuite vérifier les permissions (403 si pas autorisé)
    await this.validateUserPermission(
      boardId,
      currentUserId,
      BoardMemberPermission.VIEW,
    );

    const superBlocks = await this.superBlockRepository.find({
      where: { boardId },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });

    return superBlocks.map((superBlock) => this.mapToResponseDto(superBlock));
  }

  async findOne(
    superBlockId: string,
    currentUserId: string,
  ): Promise<SuperBlockResponseDto> {
    this.logger.log(
      `Récupération du super-block ${superBlockId} par l'utilisateur ${currentUserId}`,
    );

    const superBlock = await this.findSuperBlockEntity(superBlockId);

    // Vérifier les permissions sur le board parent
    await this.validateUserPermission(
      superBlock.boardId,
      currentUserId,
      BoardMemberPermission.VIEW,
    );

    return this.mapToResponseDto(superBlock);
  }

  async update(
    id: string,
    updateSuperBlockDto: UpdateSuperBlockDto,
    currentUserId: string,
  ): Promise<SuperBlockResponseDto> {
    this.logger.log(
      `Mise à jour du super-block ${id} par l'utilisateur ${currentUserId}`,
    );

    const superBlock = await this.findSuperBlockEntity(id);

    // Vérifier les permissions d'édition
    await this.validateUserPermission(
      superBlock.boardId,
      currentUserId,
      BoardMemberPermission.EDIT,
    );

    await this.superBlockRepository.update(id, updateSuperBlockDto);
    const updatedSuperBlock = await this.findSuperBlockEntity(id);

    this.logger.log(`Super-block ${id} mis à jour avec succès`);
    return this.mapToResponseDto(updatedSuperBlock);
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    this.logger.log(
      `Suppression du super-block ${id} par l'utilisateur ${currentUserId}`,
    );

    const superBlock = await this.findSuperBlockEntity(id);

    // Vérifier les permissions d'édition
    await this.validateUserPermission(
      superBlock.boardId,
      currentUserId,
      BoardMemberPermission.EDIT,
    );

    await this.superBlockRepository.remove(superBlock);
    this.logger.log(`Super-block ${id} supprimé avec succès`);
  }

  // Méthodes privées utilitaires
  /**
   * 🔍 Récupère une entité super-block ou lance NotFoundException
   */
  private async findSuperBlockEntity(
    superBlockId: string,
  ): Promise<SuperBlock> {
    const superBlock = await this.superBlockRepository.findOne({
      where: { id: superBlockId },
    });

    if (!superBlock) {
      throw new NotFoundException(
        `Super-block avec l'ID ${superBlockId} non trouvé`,
      );
    }

    return superBlock;
  }

  private async findBoardEntity(boardId: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Board non trouvé');
    }

    return board;
  }

  private async findUserEntity(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
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
        `Permission ${requiredPermission} requise pour cette action`,
      );
    }
  }

  private mapToResponseDto(superBlock: SuperBlock): SuperBlockResponseDto {
    return {
      id: superBlock.id,
      boardId: superBlock.boardId,
      title: superBlock.title,
      color: superBlock.color,
      collapsed: superBlock.collapsed,
      displayOrder: superBlock.displayOrder,
      positionX: superBlock.positionX,
      positionY: superBlock.positionY,
      width: superBlock.width,
      height: superBlock.height,
      createdAt: superBlock.createdAt,
      updatedAt: superBlock.updatedAt,
    };
  }
}
