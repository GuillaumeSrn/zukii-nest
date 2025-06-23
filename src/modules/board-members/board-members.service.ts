import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { BoardMember } from './entities/board-member.entity';
import { CreateBoardMemberDto } from './dto/create-board-member.dto';
import { UpdateBoardMemberPermissionDto } from './dto/update-board-member.dto';
import { BoardMemberResponseDto } from './dto/board-member-response.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { Board } from '../boards/entities/board.entity';
import { Status } from '../status/entities/status.entity';
import { BoardMemberPermission } from './enums/board-member.enum';
import { SoftDeleteHelper } from '../../common/helpers/soft-delete.helper';

@Injectable()
export class BoardMembersService {
  private readonly logger = new Logger(BoardMembersService.name);

  constructor(
    @InjectRepository(BoardMember)
    private readonly boardMemberRepository: Repository<BoardMember>,
    @InjectRepository(Status)
    private readonly statusRepository: Repository<Status>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    private readonly usersService: UsersService,
  ) {}

  async create(
    boardId: string,
    createBoardMemberDto: CreateBoardMemberDto,
    currentUserId: string,
  ): Promise<BoardMemberResponseDto> {
    this.logger.log(
      `Ajout d'un membre au board ${boardId} par l'utilisateur ${currentUserId}`,
    );

    // Vérifier que le board existe et que l'utilisateur a les permissions
    const board = await this.findBoardEntity(boardId);
    await this.validatePermission(board, currentUserId);

    // Trouver l'utilisateur à ajouter
    const userToAdd = await this.usersService.findByEmail(
      createBoardMemberDto.email,
    );
    if (!userToAdd) {
      throw new NotFoundException('Utilisateur non trouvé avec cet email');
    }

    // Vérifier que l'utilisateur n'est pas déjà membre
    const existingMember = await this.boardMemberRepository.findOne({
      where: {
        boardId,
        userId: userToAdd.id,
        deletedAt: IsNull(),
      },
    });

    if (existingMember) {
      throw new ConflictException('Cet utilisateur est déjà membre du board');
    }

    // Vérifier que l'utilisateur n'est pas le propriétaire
    if (userToAdd.id === board.ownerId) {
      throw new BadRequestException(
        'Le propriétaire du board ne peut pas être ajouté comme membre',
      );
    }

    // Récupérer le statut par défaut
    const defaultStatus = await this.statusRepository.findOne({
      where: {
        id: 'board-member-active',
        name: 'active',
        isActive: true,
      },
    });

    if (!defaultStatus) {
      throw new ConflictException('Statut par défaut non disponible');
    }

    // Créer le membre
    const boardMember = this.boardMemberRepository.create({
      boardId,
      userId: userToAdd.id,
      permissionLevel:
        createBoardMemberDto.permissionLevel || BoardMemberPermission.VIEW,
      statusId: defaultStatus.id,
      updatedBy: currentUserId,
    });

    // Sauvegarder
    const savedMember = await this.boardMemberRepository.save(boardMember);

    this.logger.log(`Membre ajouté avec succès: ${savedMember.id}`);
    return this.toBoardMemberResponseDto(savedMember, userToAdd, defaultStatus);
  }

  async findBoardMembers(
    boardId: string,
    currentUserId: string,
  ): Promise<BoardMemberResponseDto[]> {
    this.logger.log(
      `Récupération des membres du board ${boardId} par l'utilisateur ${currentUserId}`,
    );

    // Vérifier l'accès au board
    const board = await this.findBoardEntity(boardId);
    await this.validateAccessToBoard(board, currentUserId);

    // Récupérer les membres
    const members = await this.boardMemberRepository.find({
      where: {
        boardId,
        deletedAt: IsNull(),
      },
      relations: ['user', 'status'],
      order: { createdAt: 'ASC' },
    });

    return members.map((member) =>
      this.toBoardMemberResponseDto(member, member.user, member.status),
    );
  }

  async updateUserPermission(
    boardId: string,
    userId: string,
    updatePermissionDto: UpdateBoardMemberPermissionDto,
    currentUserId: string,
  ): Promise<BoardMemberResponseDto> {
    this.logger.log(
      `Mise à jour des permissions de l'utilisateur ${userId} du board ${boardId} par ${currentUserId}`,
    );

    const board = await this.findBoardEntity(boardId);
    await this.validatePermission(board, currentUserId);

    const member = await this.findBoardMemberByUserId(userId, boardId);

    Object.assign(member, updatePermissionDto);
    member.updatedBy = currentUserId;

    const updatedMember = await this.boardMemberRepository.save(member);

    this.logger.log(
      `Permissions mises à jour avec succès pour l'utilisateur ${userId}`,
    );
    return this.toBoardMemberResponseDto(
      updatedMember,
      member.user,
      member.status,
    );
  }

  async removeByUserId(
    boardId: string,
    userId: string,
    currentUserId: string,
  ): Promise<void> {
    this.logger.log(
      `Suppression de l'utilisateur ${userId} du board ${boardId} par l'utilisateur ${currentUserId}`,
    );

    const board = await this.findBoardEntity(boardId);
    await this.validatePermission(board, currentUserId);

    const member = await this.findBoardMemberByUserId(userId, boardId);

    await SoftDeleteHelper.softDeleteWithUser(
      this.boardMemberRepository,
      this.statusRepository,
      member.id,
      currentUserId,
      'board-member',
      'inactive',
    );

    this.logger.log(`Utilisateur supprimé avec succès: ${userId}`);
  }

  private async findBoardEntity(id: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['owner'],
    });

    if (!board) {
      throw new NotFoundException('Board non trouvé');
    }

    return board;
  }

  private async findBoardMemberEntity(
    memberId: string,
    boardId: string,
  ): Promise<BoardMember> {
    const member = await this.boardMemberRepository.findOne({
      where: { id: memberId, boardId, deletedAt: IsNull() },
      relations: ['user', 'status'],
    });

    if (!member) {
      throw new NotFoundException('Membre non trouvé');
    }

    return member;
  }

  // Méthode réutilisant le code existant pour rechercher par userId
  private async findBoardMemberByUserId(
    userId: string,
    boardId: string,
  ): Promise<BoardMember> {
    const member = await this.boardMemberRepository.findOne({
      where: { userId, boardId, deletedAt: IsNull() },
      relations: ['user', 'status'],
    });

    if (!member) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return member;
  }

  private async validatePermission(
    board: Board,
    currentUserId: string,
  ): Promise<void> {
    // Le propriétaire a tous les droits
    if (board.ownerId === currentUserId) {
      return;
    }

    // Vérifier si l'utilisateur est admin du board
    const memberPermission = await this.boardMemberRepository.findOne({
      where: {
        boardId: board.id,
        userId: currentUserId,
        permissionLevel: BoardMemberPermission.ADMIN,
        deletedAt: IsNull(),
      },
    });

    if (!memberPermission) {
      this.logger.warn(
        `Tentative d'accès non autorisée au board ${board.id} par l'utilisateur ${currentUserId}`,
      );
      throw new ForbiddenException(
        'Seuls le propriétaire et les administrateurs peuvent gérer les membres',
      );
    }
  }

  private async validateAccessToBoard(
    board: Board,
    currentUserId: string,
  ): Promise<void> {
    // Le propriétaire a tous les droits
    if (board.ownerId === currentUserId) {
      return;
    }

    // Vérifier si l'utilisateur est membre
    const memberAccess = await this.boardMemberRepository.findOne({
      where: {
        boardId: board.id,
        userId: currentUserId,
        deletedAt: IsNull(),
      },
    });

    if (!memberAccess) {
      this.logger.warn(
        `Tentative d'accès non autorisée au board ${board.id} par l'utilisateur ${currentUserId}`,
      );
      throw new ForbiddenException('Accès non autorisé à ce board');
    }
  }

  private toBoardMemberResponseDto(
    member: BoardMember,
    user: User,
    status: Status,
  ): BoardMemberResponseDto {
    const userDto = {
      id: user.id,
      displayName: user.displayName,
      isActive: user.status?.isActive ?? true,
    };

    const statusDto = {
      id: status.id,
      category: status.category,
      name: status.name,
      isActive: status.isActive,
    };

    return {
      id: member.id,
      permissionLevel: member.permissionLevel,
      user: userDto,
      status: statusDto,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
  }
}
