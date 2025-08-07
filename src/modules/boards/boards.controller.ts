import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  Logger,
  UseInterceptors,
  ClassSerializerInterceptor,
  Request,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { BoardLockService } from './board-lock.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardResponseDto } from './dto/board-response.dto';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { BoardFullResponseDto } from './dto/board-full-response.dto';
import { BoardMembersService } from '../board-members/board-members.service';
import { SuperBlocksService } from '../super-blocks/super-blocks.service';
import { BlocksService } from '../blocks/blocks.service';
import { AnalysisContentService } from '../analysis-content/analysis-content.service';
import { BlockType } from '../blocks/enums/block.enum';
@ApiTags('Boards')
@Controller('boards')
@UseInterceptors(ClassSerializerInterceptor)
export class BoardsController {
  private readonly logger = new Logger(BoardsController.name);

  constructor(
    private readonly boardsService: BoardsService,
    private readonly boardLockService: BoardLockService,
    private readonly boardMembersService: BoardMembersService,
    private readonly superBlocksService: SuperBlocksService,
    private readonly blocksService: BlocksService,
    private readonly analysisContentService: AnalysisContentService,
  ) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau board',
    description:
      'Permet à un utilisateur authentifié de créer un nouveau board',
  })
  @ApiBody({ type: CreateBoardDto })
  @ApiResponse({
    status: 201,
    description: 'Board créé avec succès',
    type: BoardResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données de création invalides',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  @ApiResponse({
    status: 409,
    description: 'Statut par défaut non disponible',
  })
  async create(
    @Body() createBoardDto: CreateBoardDto,
    @Request() req: { user: JwtUser },
  ): Promise<BoardResponseDto> {
    this.logger.log(`Création d'un board par l'utilisateur ${req.user.id}`);
    const board = await this.boardsService.create(createBoardDto, req.user.id);
    this.logger.log(`Board ${board.id} créé avec succès`);
    return board;
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lister mes boards',
    description:
      'Récupère tous les boards accessibles (propriétaire ou membre)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des boards récupérée avec succès',
    type: [BoardResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  async findMyBoards(
    @Request() req: { user: JwtUser },
  ): Promise<BoardResponseDto[]> {
    this.logger.log(
      `Récupération des boards pour l'utilisateur ${req.user.id}`,
    );
    const boards = await this.boardsService.findMyBoards(req.user.id);
    this.logger.log(
      `${boards.length} boards récupérés pour l'utilisateur ${req.user.id}`,
    );
    return boards;
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer un board par son ID',
    description:
      'Récupère les détails complets du board (permission VIEW requise)',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Board récupéré avec succès',
    type: BoardResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'UUID invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé à ce board',
  })
  @ApiResponse({
    status: 404,
    description: 'Board non trouvé',
  })
  async findOne(
    @Param('id', UuidValidationPipe) id: string,
    @Request() req: { user: JwtUser },
  ): Promise<BoardResponseDto> {
    const board = await this.boardsService.findById(id, req.user.id);
    return board;
  }

  @Get(':id/full')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer toutes les données du board (agrégé)',
    description:
      'Retourne le board, ses blocks (en preview), super-blocks, membres et fichiers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Board agrégé',
    type: BoardFullResponseDto,
  })
  async getFullBoard(
    @Param('id', UuidValidationPipe) id: string,
    @Request() req: { user: JwtUser },
  ): Promise<BoardFullResponseDto> {
    // 1. Récupérer le board principal
    const board = await this.boardsService.findById(id, req.user.id);
    // 2. Récupérer les membres
    const members = await this.boardMembersService.findBoardMembers(
      id,
      req.user.id,
    );
    // 3. Récupérer les super-blocks
    const superBlocks = await this.superBlocksService.findByBoard(
      id,
      req.user.id,
    );
    // 4. Récupérer les blocks (en preview)
    const blocks = await this.blocksService.findByBoard(id, req.user.id);

    // 5. Récupérer les informations minimales des AnalysisContent pour les blocks d'analyse
    const analysisBlocks = blocks.filter(
      (block) => block.blockType === BlockType.ANALYSIS,
    );
    const analysisContentIds = analysisBlocks.map((block) => block.contentId);
    const analysisContents =
      await this.analysisContentService.findByIds(analysisContentIds);

    // 6. Transformer les AnalysisContent en DTO minimal (pour l'affichage de base)
    const analysisContentsDto = analysisContents.map((content) => ({
      id: content.id,
      title: content.title,
      status: content.status,
      linkedFileIds: content.linkedFileIds,
      createdAt: content.createdAt?.toISOString?.() ?? '',
      updatedAt: content.updatedAt?.toISOString?.() ?? '',
    }));

    return {
      id: board.id,
      title: board.title,
      description: board.description ?? '',
      backgroundColor: board.backgroundColor ?? '',
      owner: board.owner,
      status: board.status,
      createdAt: board.createdAt?.toISOString?.() ?? '',
      updatedAt: board.updatedAt?.toISOString?.() ?? '',
      members,
      superBlocks,
      blocks,
      analysisContents: analysisContentsDto,
    };
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Mettre à jour un board',
    description: 'Met à jour un board existant (propriétaire uniquement)',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateBoardDto })
  @ApiResponse({
    status: 200,
    description: 'Board mis à jour avec succès',
    type: BoardResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données de mise à jour invalides ou UUID invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé à ce board',
  })
  @ApiResponse({
    status: 404,
    description: 'Board non trouvé',
  })
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() updateBoardDto: UpdateBoardDto,
    @Request() req: { user: JwtUser },
  ): Promise<BoardResponseDto> {
    this.logger.log(
      `Mise à jour du board ${id} par l'utilisateur ${req.user.id}`,
    );
    const board = await this.boardsService.update(
      id,
      updateBoardDto,
      req.user.id,
    );
    this.logger.log(`Board ${id} mis à jour avec succès`);
    return board;
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un board',
    description: 'Supprime définitivement un board (propriétaire uniquement)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du board à supprimer',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Board supprimé avec succès',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé (propriétaire uniquement)',
  })
  @ApiResponse({
    status: 404,
    description: 'Board non trouvé',
  })
  async remove(
    @Param('id', UuidValidationPipe) id: string,
    @Request() req: { user: JwtUser },
  ): Promise<void> {
    this.logger.log(
      `Suppression du board ${id} par l'utilisateur ${req.user.id}`,
    );
    await this.boardsService.remove(id, req.user.id);
    this.logger.log(`Board ${id} supprimé avec succès`);
  }

  @Post(':id/lock')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verrouiller un board',
    description: "Verrouille un board pour l'utilisateur actuel",
  })
  @ApiParam({
    name: 'id',
    description: 'ID du board à verrouiller',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Board verrouillé avec succès',
  })
  @ApiResponse({
    status: 409,
    description: 'Board déjà verrouillé par un autre utilisateur',
  })
  async lockBoard(
    @Param('id', UuidValidationPipe) id: string,
    @Request() req: { user: JwtUser },
  ): Promise<{ success: boolean }> {
    await this.boardLockService.lockBoard(id, req.user.id);
    return { success: true };
  }

  @Delete(':id/unlock')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Déverrouiller un board',
    description: "Déverrouille un board pour l'utilisateur actuel",
  })
  @ApiParam({
    name: 'id',
    description: 'ID du board à déverrouiller',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Board déverrouillé avec succès',
  })
  async unlockBoard(
    @Param('id', UuidValidationPipe) id: string,
    @Request() req: { user: JwtUser },
  ): Promise<void> {
    await this.boardLockService.unlockBoard(id, req.user.id);
  }

  @Get(':id/lock-status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Vérifier le statut du verrou',
    description: 'Vérifie si un board est verrouillé',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du board à vérifier',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Statut du verrou récupéré',
    schema: {
      type: 'object',
      properties: {
        locked: { type: 'boolean' },
        lockedBy: { type: 'string', nullable: true },
        lockedAt: { type: 'string', nullable: true },
      },
    },
  })
  async getLockStatus(
    @Param('id', UuidValidationPipe) id: string,
  ): Promise<{ locked: boolean; lockedBy?: string; lockedAt?: string }> {
    const lock = await this.boardLockService.getBoardLock(id);
    if (lock) {
      return {
        locked: true,
        lockedBy: lock.userId,
        lockedAt: lock.lockedAt.toISOString(),
      };
    }
    return { locked: false };
  }
}
