import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';

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
    const board = await this.boardsService.create(createBoardDto, req.user.id);
    this.logger.log(`Board ${board.id} créé avec succès`);
    return board;
  }

  @Get()
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
    const boards = await this.boardsService.findMyBoards(req.user.id);
    this.logger.log(
      `${boards.length} boards récupérés pour l'utilisateur ${req.user.id}`,
    );
    return boards;
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer un board par ID',
    description:
      "Récupère les détails d'un board spécifique dont je suis propriétaire",
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
    this.logger.log(
      `Récupération du board ${id} par l'utilisateur ${req.user.id}`,
    );
    const board = await this.boardsService.findById(id, req.user.id);
    this.logger.log(`Board ${id} récupéré avec succès`);
    return board;
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
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
    description: 'Supprime un board existant (propriétaire uniquement)',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Board supprimé avec succès',
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
}
