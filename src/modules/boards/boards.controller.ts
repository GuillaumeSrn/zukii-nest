import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Logger,
  HttpStatus,
  HttpCode,
  Request,
  UseInterceptors,
  ClassSerializerInterceptor,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardResponseDto } from './dto/board-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface JwtUser {
  id: string;
}

@ApiTags('Boards')
@Controller('boards')
@UseInterceptors(ClassSerializerInterceptor)
export class BoardsController {
  private readonly logger = new Logger(BoardsController.name);

  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
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
    try {
      const board = await this.boardsService.create(
        createBoardDto,
        req.user.id,
      );
      this.logger.log(`Board ${board.id} créé avec succès`);
      return board;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création du board: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lister mes boards',
    description: 'Récupère tous les boards dont je suis propriétaire',
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
    try {
      const boards = await this.boardsService.findMyBoards(req.user.id);
      this.logger.log(
        `${boards.length} boards récupérés pour l'utilisateur ${req.user.id}`,
      );
      return boards;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des boards: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer un board par ID',
    description:
      "Récupère les détails d'un board spécifique dont je suis propriétaire",
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant UUID du board',
    example: 'board-abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Board récupéré avec succès',
    type: BoardResponseDto,
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
    @Param('id') id: string,
    @Request() req: { user: JwtUser },
  ): Promise<BoardResponseDto> {
    this.logger.log(
      `Récupération du board ${id} par l'utilisateur ${req.user.id}`,
    );
    try {
      const board = await this.boardsService.findById(id, req.user.id);
      this.logger.log(`Board ${id} récupéré avec succès`);
      return board;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération du board ${id}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
      throw error;
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Mettre à jour un board',
    description: 'Met à jour un board existant (propriétaire uniquement)',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant UUID du board',
    example: 'board-abc123',
  })
  @ApiBody({ type: UpdateBoardDto })
  @ApiResponse({
    status: 200,
    description: 'Board mis à jour avec succès',
    type: BoardResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données de mise à jour invalides',
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
    @Param('id') id: string,
    @Body() updateBoardDto: UpdateBoardDto,
    @Request() req: { user: JwtUser },
  ): Promise<BoardResponseDto> {
    this.logger.log(
      `Mise à jour du board ${id} par l'utilisateur ${req.user.id}`,
    );
    try {
      const board = await this.boardsService.update(
        id,
        updateBoardDto,
        req.user.id,
      );
      this.logger.log(`Board ${id} mis à jour avec succès`);
      return board;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour du board ${id}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un board',
    description: 'Supprime un board existant (propriétaire uniquement)',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant UUID du board',
    example: 'board-abc123',
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
    description: 'Accès non autorisé à ce board',
  })
  @ApiResponse({
    status: 404,
    description: 'Board non trouvé',
  })
  async remove(
    @Param('id') id: string,
    @Request() req: { user: JwtUser },
  ): Promise<void> {
    this.logger.log(
      `Suppression du board ${id} par l'utilisateur ${req.user.id}`,
    );
    try {
      await this.boardsService.remove(id, req.user.id);
      this.logger.log(`Board ${id} supprimé avec succès`);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression du board ${id}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
      throw error;
    }
  }
}
