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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { BoardMembersService } from './board-members.service';
import { CreateBoardMemberDto } from './dto/create-board-member.dto';
import { UpdateBoardMemberDto } from './dto/update-board-member.dto';
import { BoardMemberResponseDto } from './dto/board-member-response.dto';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';

@ApiTags('Board Members')
@Controller('boards/:boardId/members')
@UseInterceptors(ClassSerializerInterceptor)
export class BoardMembersController {
  private readonly logger = new Logger(BoardMembersController.name);

  constructor(private readonly boardMembersService: BoardMembersService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ajouter un membre au board',
    description: "Permet au propriétaire ou admin d'ajouter un membre au board",
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: CreateBoardMemberDto })
  @ApiResponse({
    status: 201,
    description: 'Membre ajouté avec succès',
    type: BoardMemberResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou utilisateur déjà propriétaire',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description:
      'Seuls le propriétaire et les administrateurs peuvent ajouter des membres',
  })
  @ApiResponse({
    status: 404,
    description: 'Board ou utilisateur non trouvé',
  })
  @ApiResponse({
    status: 409,
    description: 'Utilisateur déjà membre du board',
  })
  async create(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Body() createBoardMemberDto: CreateBoardMemberDto,
    @Request() req: { user: JwtUser },
  ): Promise<BoardMemberResponseDto> {
    this.logger.log(
      `Ajout d'un membre au board ${boardId} par l'utilisateur ${req.user.id}`,
    );
    const member = await this.boardMembersService.create(
      boardId,
      createBoardMemberDto,
      req.user.id,
    );
    this.logger.log(
      `Membre ${member.id} ajouté avec succès au board ${boardId}`,
    );
    return member;
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lister les membres du board',
    description:
      'Récupère tous les membres du board (accessible aux membres et propriétaire)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des membres récupérée avec succès',
    type: [BoardMemberResponseDto],
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
  async findAll(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Request() req: { user: JwtUser },
  ): Promise<BoardMemberResponseDto[]> {
    this.logger.log(
      `Récupération des membres du board ${boardId} par l'utilisateur ${req.user.id}`,
    );
    const members = await this.boardMembersService.findBoardMembers(
      boardId,
      req.user.id,
    );
    this.logger.log(
      `${members.length} membres récupérés pour le board ${boardId}`,
    );
    return members;
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Modifier les permissions d'un membre",
    description:
      "Met à jour les permissions d'un membre (propriétaire et admin uniquement)",
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant UUID du membre',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiBody({ type: UpdateBoardMemberDto })
  @ApiResponse({
    status: 200,
    description: 'Permissions du membre mises à jour avec succès',
    type: BoardMemberResponseDto,
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
    description:
      'Seuls le propriétaire et les administrateurs peuvent modifier les permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Board ou membre non trouvé',
  })
  async update(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Param('id', UuidValidationPipe) id: string,
    @Body() updateBoardMemberDto: UpdateBoardMemberDto,
    @Request() req: { user: JwtUser },
  ): Promise<BoardMemberResponseDto> {
    this.logger.log(
      `Mise à jour du membre ${id} du board ${boardId} par l'utilisateur ${req.user.id}`,
    );
    const member = await this.boardMembersService.update(
      boardId,
      id,
      updateBoardMemberDto,
      req.user.id,
    );
    this.logger.log(`Membre ${id} mis à jour avec succès`);
    return member;
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Retirer un membre du board',
    description:
      'Supprime un membre du board (propriétaire et admin uniquement)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant UUID du membre',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 204,
    description: 'Membre retiré avec succès',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  @ApiResponse({
    status: 403,
    description:
      'Seuls le propriétaire et les administrateurs peuvent retirer des membres',
  })
  @ApiResponse({
    status: 404,
    description: 'Board ou membre non trouvé',
  })
  async remove(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Param('id', UuidValidationPipe) id: string,
    @Request() req: { user: JwtUser },
  ): Promise<void> {
    this.logger.log(
      `Suppression du membre ${id} du board ${boardId} par l'utilisateur ${req.user.id}`,
    );
    await this.boardMembersService.remove(boardId, id, req.user.id);
    this.logger.log(`Membre ${id} supprimé avec succès du board ${boardId}`);
  }
}
