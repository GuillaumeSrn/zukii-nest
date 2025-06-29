import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  HttpStatus,
  HttpCode,
  Logger,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto, UpdateBlockPositionDto } from './dto/update-block.dto';
import { BlockResponseDto } from './dto/block-response.dto';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';

@ApiTags('Blocks')
@Controller('boards/:boardId/blocks')
@UseInterceptors(ClassSerializerInterceptor)
export class BlocksController {
  private readonly logger = new Logger(BlocksController.name);

  constructor(private readonly blocksService: BlocksService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau block',
    description:
      'Permet de créer un block dans un board (permission EDIT requise)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: CreateBlockDto })
  @ApiResponse({
    status: 201,
    description: 'Block créé avec succès',
    type: BlockResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données de création invalides ou UUID invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes pour créer un block',
  })
  @ApiResponse({
    status: 404,
    description: 'Board non trouvé',
  })
  @ApiResponse({
    status: 409,
    description: 'Statut par défaut non disponible',
  })
  async create(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Body() createBlockDto: CreateBlockDto,
    @Request() req: { user: JwtUser },
  ): Promise<BlockResponseDto> {
    this.logger.log(
      `Création d'un block dans le board ${boardId} par l'utilisateur ${req.user.id}`,
    );
    const block = await this.blocksService.create(
      boardId,
      createBlockDto,
      req.user.id,
    );
    this.logger.log(`Block ${block.id} créé avec succès`);
    return block;
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Récupérer tous les blocks d'un board",
    description:
      'Récupère tous les blocks actifs du board (permission VIEW requise)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des blocks récupérée avec succès',
    type: [BlockResponseDto],
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
  async findByBoard(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Request() req: { user: JwtUser },
  ): Promise<BlockResponseDto[]> {
    this.logger.log(
      `Récupération des blocks du board ${boardId} par l'utilisateur ${req.user.id}`,
    );
    const blocks = await this.blocksService.findByBoard(boardId, req.user.id);
    this.logger.log(
      `${blocks.length} blocks récupérés pour le board ${boardId}`,
    );
    return blocks;
  }

  @Get(':blockId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer un block par son ID',
    description:
      "Récupère les détails d'un block spécifique (permission VIEW requise)",
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'blockId',
    description: 'Identifiant UUID du block',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 200,
    description: 'Block récupéré avec succès',
    type: BlockResponseDto,
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
    description: 'Block non trouvé',
  })
  async findOne(
    @Param('blockId', UuidValidationPipe) blockId: string,
    @Request() req: { user: JwtUser },
  ): Promise<BlockResponseDto> {
    this.logger.log(
      `Récupération du block ${blockId} par l'utilisateur ${req.user.id}`,
    );
    const block = await this.blocksService.findOne(blockId, req.user.id);
    this.logger.log(`Block ${blockId} récupéré avec succès`);
    return block;
  }

  @Patch(':blockId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Modifier un block',
    description:
      "Met à jour les propriétés d'un block (permission EDIT requise)",
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'blockId',
    description: 'Identifiant UUID du block',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiBody({ type: UpdateBlockDto })
  @ApiResponse({
    status: 200,
    description: 'Block modifié avec succès',
    type: BlockResponseDto,
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
    description: 'Permissions insuffisantes pour modifier ce block',
  })
  @ApiResponse({
    status: 404,
    description: 'Block non trouvé',
  })
  async update(
    @Param('blockId', UuidValidationPipe) blockId: string,
    @Body() updateBlockDto: UpdateBlockDto,
    @Request() req: { user: JwtUser },
  ): Promise<BlockResponseDto> {
    this.logger.log(
      `Mise à jour du block ${blockId} par l'utilisateur ${req.user.id}`,
    );
    const block = await this.blocksService.update(
      blockId,
      updateBlockDto,
      req.user.id,
    );
    this.logger.log(`Block ${blockId} mis à jour avec succès`);
    return block;
  }

  @Patch(':blockId/position')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Modifier la position d'un block",
    description:
      'Met à jour uniquement la position et les dimensions (permission EDIT requise)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'blockId',
    description: 'Identifiant UUID du block',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiBody({ type: UpdateBlockPositionDto })
  @ApiResponse({
    status: 200,
    description: 'Position du block modifiée avec succès',
    type: BlockResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données de position invalides ou UUID invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes pour modifier ce block',
  })
  @ApiResponse({
    status: 404,
    description: 'Block non trouvé',
  })
  async updatePosition(
    @Param('blockId', UuidValidationPipe) blockId: string,
    @Body() positionDto: UpdateBlockPositionDto,
    @Request() req: { user: JwtUser },
  ): Promise<BlockResponseDto> {
    this.logger.log(
      `Mise à jour de la position du block ${blockId} par l'utilisateur ${req.user.id}`,
    );
    const block = await this.blocksService.updatePosition(
      blockId,
      positionDto,
      req.user.id,
    );
    this.logger.log(`Position du block ${blockId} mise à jour avec succès`);
    return block;
  }

  @Delete(':blockId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un block',
    description: 'Supprime définitivement un block (permission EDIT requise)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'blockId',
    description: 'Identifiant UUID du block',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 204,
    description: 'Block supprimé avec succès',
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
    description: 'Permissions insuffisantes pour supprimer ce block',
  })
  @ApiResponse({
    status: 404,
    description: 'Block non trouvé ou déjà supprimé',
  })
  async remove(
    @Param('blockId', UuidValidationPipe) blockId: string,
    @Request() req: { user: JwtUser },
  ): Promise<void> {
    this.logger.log(
      `Suppression du block ${blockId} par l'utilisateur ${req.user.id}`,
    );
    await this.blocksService.remove(blockId, req.user.id);
    this.logger.log(`Block ${blockId} supprimé avec succès`);
  }
}
