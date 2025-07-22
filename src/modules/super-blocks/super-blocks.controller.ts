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
import { SuperBlocksService } from './super-blocks.service';
import { CreateSuperBlockDto } from './dto/create-super-block.dto';
import { UpdateSuperBlockDto } from './dto/update-super-block.dto';
import { SuperBlockResponseDto } from './dto/super-block-response.dto';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';

@ApiTags('SuperBlocks')
@Controller('boards/:boardId/super-blocks')
@UseInterceptors(ClassSerializerInterceptor)
export class SuperBlocksController {
  private readonly logger = new Logger(SuperBlocksController.name);

  constructor(private readonly superBlocksService: SuperBlocksService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau super-block',
    description:
      'Permet de créer un super-block dans un board (permission EDIT requise)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: CreateSuperBlockDto })
  @ApiResponse({
    status: 201,
    description: 'Super-block créé avec succès',
    type: SuperBlockResponseDto,
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
    description: 'Permissions insuffisantes pour créer un super-block',
  })
  @ApiResponse({
    status: 404,
    description: 'Board non trouvé',
  })
  async create(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Body() createSuperBlockDto: CreateSuperBlockDto,
    @Request() req: { user: JwtUser },
  ): Promise<SuperBlockResponseDto> {
    this.logger.log(
      `Création d'un super-block dans le board ${boardId} par l'utilisateur ${req.user.id}`,
    );
    const superBlock = await this.superBlocksService.create(
      boardId,
      createSuperBlockDto,
      req.user.id,
    );
    this.logger.log(`Super-block ${superBlock.id} créé avec succès`);
    return superBlock;
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Récupérer tous les super-blocks d'un board",
    description:
      'Récupère tous les super-blocks du board (permission VIEW requise)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des super-blocks récupérée avec succès',
    type: [SuperBlockResponseDto],
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
  ): Promise<SuperBlockResponseDto[]> {
    this.logger.log(
      `Récupération des super-blocks du board ${boardId} par l'utilisateur ${req.user.id}`,
    );
    const superBlocks = await this.superBlocksService.findByBoard(
      boardId,
      req.user.id,
    );
    this.logger.log(
      `${superBlocks.length} super-blocks récupérés pour le board ${boardId}`,
    );
    return superBlocks;
  }

  @Get(':superBlockId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer un super-block spécifique',
    description:
      'Récupère un super-block avec ses métadonnées (permission VIEW requise)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'superBlockId',
    description: 'Identifiant UUID du super-block',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 200,
    description: 'Super-block récupéré avec succès',
    type: SuperBlockResponseDto,
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
    description: 'Permissions insuffisantes pour voir ce super-block',
  })
  @ApiResponse({
    status: 404,
    description: 'Super-block non trouvé',
  })
  async findOne(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Param('superBlockId', UuidValidationPipe) superBlockId: string,
    @Request() req: { user: JwtUser },
  ): Promise<SuperBlockResponseDto> {
    return this.superBlocksService.findOne(superBlockId, req.user.id);
  }

  @Patch(':superBlockId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Modifier un super-block',
    description:
      "Met à jour les propriétés d'un super-block (permission EDIT requise)",
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'superBlockId',
    description: 'Identifiant UUID du super-block',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiBody({ type: UpdateSuperBlockDto })
  @ApiResponse({
    status: 200,
    description: 'Super-block modifié avec succès',
    type: SuperBlockResponseDto,
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
    description: 'Permissions insuffisantes pour modifier ce super-block',
  })
  @ApiResponse({
    status: 404,
    description: 'Super-block non trouvé',
  })
  async update(
    @Param('superBlockId', UuidValidationPipe) superBlockId: string,
    @Body() updateSuperBlockDto: UpdateSuperBlockDto,
    @Request() req: { user: JwtUser },
  ): Promise<SuperBlockResponseDto> {
    this.logger.log(
      `Mise à jour du super-block ${superBlockId} par l'utilisateur ${req.user.id}`,
    );
    const superBlock = await this.superBlocksService.update(
      superBlockId,
      updateSuperBlockDto,
      req.user.id,
    );
    this.logger.log(`Super-block ${superBlockId} mis à jour avec succès`);
    return superBlock;
  }

  @Delete(':superBlockId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un super-block',
    description:
      'Supprime définitivement un super-block (permission EDIT requise)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'superBlockId',
    description: 'Identifiant UUID du super-block',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 204,
    description: 'Super-block supprimé avec succès',
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
    description: 'Permissions insuffisantes pour supprimer ce super-block',
  })
  @ApiResponse({
    status: 404,
    description: 'Super-block non trouvé ou déjà supprimé',
  })
  async remove(
    @Param('superBlockId', UuidValidationPipe) superBlockId: string,
    @Request() req: { user: JwtUser },
  ): Promise<void> {
    this.logger.log(
      `Suppression du super-block ${superBlockId} par l'utilisateur ${req.user.id}`,
    );
    await this.superBlocksService.remove(superBlockId, req.user.id);
    this.logger.log(`Super-block ${superBlockId} supprimé avec succès`);
  }
}
