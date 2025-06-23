import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Board } from './entities/board.entity';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardResponseDto } from './dto/board-response.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { Status } from '../status/entities/status.entity';
import { SoftDeleteHelper } from '../../common/helpers/soft-delete.helper';

@Injectable()
export class BoardsService {
  private readonly logger = new Logger(BoardsService.name);

  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Status)
    private readonly statusRepository: Repository<Status>,
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

  async findMyBoards(ownerId: string): Promise<BoardResponseDto[]> {
    this.logger.log(`Récupération des boards pour l'utilisateur ${ownerId}`);

    const boards = await this.boardRepository.find({
      where: {
        ownerId,
        deletedAt: IsNull(),
      },
      relations: ['owner', 'status'],
      order: { updatedAt: 'DESC' },
    });

    return boards.map((board) =>
      this.toBoardResponseDto(board, board.owner, board.status),
    );
  }

  async findById(id: string, currentUserId: string): Promise<BoardResponseDto> {
    this.logger.log(
      `Récupération du board ${id} par l'utilisateur ${currentUserId}`,
    );

    const board = await this.findBoardEntity(id);
    this.validateOwnership(board, currentUserId);

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
    this.validateOwnership(board, currentUserId);

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
    this.validateOwnership(board, currentUserId);

    // Utiliser le helper pour le soft delete avec traçabilité
    await SoftDeleteHelper.softDeleteWithUser(
      this.boardRepository,
      this.statusRepository,
      id,
      currentUserId,
      'board',
      'archived',
    );

    this.logger.log(`Board supprimé avec succès: ${id}`);
  }

  private async findBoardEntity(id: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { id, deletedAt: IsNull() },
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
      updatedAt: board.updatedAt,
    };
  }
}
