import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardResponseDto } from './dto/board-response.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { Status } from '../status/entities/status.entity';
import { BoardMember } from '../board-members/entities/board-member.entity';
import { BoardMemberPermission } from '../board-members/enums/board-member.enum';

@Injectable()
export class BoardsService {
  private readonly logger = new Logger(BoardsService.name);

  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Status)
    private readonly statusRepository: Repository<Status>,
    @InjectRepository(BoardMember)
    private readonly boardMemberRepository: Repository<BoardMember>,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createBoardDto: CreateBoardDto,
    ownerId: string,
  ): Promise<BoardResponseDto> {
    this.logger.log(`Création d'un nouveau board par l'utilisateur ${ownerId}`);

    const owner = await this.usersService.findByIdEntity(ownerId);
    if (!owner) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const defaultStatus = await this.statusRepository.findOne({
      where: { category: 'board', name: 'active', isActive: true },
    });
    if (!defaultStatus) {
      throw new ConflictException('Statut par défaut non disponible');
    }

    const board = this.boardRepository.create({
      ...createBoardDto,
      ownerId,
      statusId: defaultStatus.id,
    });

    const savedBoard = await this.boardRepository.save(board);

    this.logger.log(`Board créé avec succès: ${savedBoard.id}`);
    return this.toBoardResponseDto(savedBoard, owner, defaultStatus);
  }

  async findMyBoards(userId: string): Promise<BoardResponseDto[]> {
    this.logger.log(`Récupération des boards pour l'utilisateur ${userId}`);

    // Récupère tous les boards où l'utilisateur est propriétaire OU membre
    const boards = await this.boardRepository
      .createQueryBuilder('board')
      .leftJoinAndSelect('board.owner', 'owner')
      .leftJoinAndSelect('board.status', 'status')
      .leftJoin('board.members', 'member')
      .where('board.ownerId = :userId', { userId })
      .orWhere('member.userId = :userId', { userId })
      .orderBy('board.updatedAt', 'DESC')
      .getMany();

    return boards.map((board) =>
      this.toBoardResponseDto(board, board.owner, board.status),
    );
  }

  async findById(id: string, currentUserId: string): Promise<BoardResponseDto> {
    this.logger.log(
      `Récupération du board ${id} par l'utilisateur ${currentUserId}`,
    );

    const board = await this.findBoardEntity(id);

    // Vérifier si l'utilisateur est propriétaire OU membre du board
    await this.validateBoardAccess(board, currentUserId);

    return this.toBoardResponseDto(board, board.owner, board.status);
  }

  async update(
    id: string,
    updateBoardDto: UpdateBoardDto,
    currentUserId: string,
  ): Promise<BoardResponseDto> {
    this.logger.log(
      `Mise à jour du board ${id} par l'utilisateur ${currentUserId}`,
    );

    const board = await this.findBoardEntity(id);
    // ✅ SÉCURITÉ : Vérifier permission EDIT ou plus
    await this.validateBoardPermission(
      board,
      currentUserId,
      BoardMemberPermission.EDIT,
    );

    Object.assign(board, updateBoardDto);
    const updatedBoard = await this.boardRepository.save(board);

    this.logger.log(`Board mis à jour avec succès: ${updatedBoard.id}`);
    return this.toBoardResponseDto(updatedBoard, board.owner, board.status);
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    this.logger.log(
      `Suppression du board ${id} par l'utilisateur ${currentUserId}`,
    );

    const board = await this.findBoardEntity(id);
    // ✅ SÉCURITÉ : Seuls le propriétaire peut supprimer (pas les membres ADMIN)
    this.validateOwnership(board, currentUserId);

    // ✅ AMÉLIORATION : Utiliser remove() pour garantir les cascades TypeORM
    await this.boardRepository.remove(board);

    this.logger.log(`Board et ses dépendances supprimés avec succès: ${id}`);
  }

  private async findBoardEntity(id: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: ['owner', 'status'],
    });

    if (!board) {
      throw new NotFoundException('Board non trouvé');
    }

    return board;
  }

  private validateOwnership(board: Board, currentUserId: string): void {
    if (board.ownerId !== currentUserId) {
      this.logger.warn(
        `Tentative d'accès non autorisée au board ${board.id} par l'utilisateur ${currentUserId}`,
      );
      throw new ForbiddenException('Accès non autorisé à ce board');
    }
  }

  private async validateBoardAccess(
    board: Board,
    currentUserId: string,
  ): Promise<void> {
    // Si l'utilisateur est propriétaire, accès autorisé
    if (board.ownerId === currentUserId) {
      return;
    }

    // Vérifier si l'utilisateur est membre du board
    const memberAccess = await this.boardMemberRepository.findOne({
      where: {
        boardId: board.id,
        userId: currentUserId,
      },
    });

    if (!memberAccess) {
      this.logger.warn(
        `Tentative d'accès non autorisée au board ${board.id} par l'utilisateur ${currentUserId}`,
      );
      throw new ForbiddenException('Accès non autorisé à ce board');
    }
  }

  private async validateBoardPermission(
    board: Board,
    currentUserId: string,
    requiredPermission: BoardMemberPermission,
  ): Promise<void> {
    // Le propriétaire a toujours accès
    if (board.ownerId === currentUserId) {
      return;
    }

    // Vérifier les permissions du membre
    const member = await this.boardMemberRepository.findOne({
      where: {
        boardId: board.id,
        userId: currentUserId,
      },
    });

    if (!member) {
      this.logger.warn(
        `Tentative d'accès non autorisée au board ${board.id} par l'utilisateur ${currentUserId}`,
      );
      throw new ForbiddenException('Accès non autorisé à ce board');
    }

    // Vérification des permissions hiérarchiques
    const permissionLevels = {
      [BoardMemberPermission.VIEW]: 1,
      [BoardMemberPermission.EDIT]: 2,
      [BoardMemberPermission.ADMIN]: 3,
    };

    const userLevel = permissionLevels[member.permissionLevel];
    const requiredLevel = permissionLevels[requiredPermission];

    if (userLevel < requiredLevel) {
      this.logger.warn(
        `Permissions insuffisantes pour l'utilisateur ${currentUserId} sur le board ${board.id}. Requis: ${requiredPermission}, Actuel: ${member.permissionLevel}`,
      );
      throw new ForbiddenException(
        'Permissions insuffisantes pour cette action',
      );
    }
  }

  private toBoardResponseDto(
    board: Board,
    owner: User,
    status: Status,
  ): BoardResponseDto {
    const statusDto = {
      id: status.id,
      category: status.category,
      name: status.name,
      isActive: status.isActive,
    };

    return {
      id: board.id,
      title: board.title,
      description: board.description,
      backgroundColor: board.backgroundColor,
      owner: {
        id: owner.id,
        displayName: owner.displayName,
        isActive: true,
      },
      status: statusDto,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  }
}
