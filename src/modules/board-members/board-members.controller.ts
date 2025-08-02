import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  Logger,
  HttpStatus,
  HttpCode,
  Request,
  UseInterceptors,
  ClassSerializerInterceptor,
  Body,
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
import { UpdateBoardMemberPermissionDto } from './dto/update-board-member.dto';
import { BoardMemberResponseDto } from './dto/board-member-response.dto';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';

@ApiTags('Board Members')
@Controller('boards/:boardId/members')
@UseInterceptors(ClassSerializerInterceptor)
export class BoardMembersController {
  private readonly logger = new Logger(BoardMembersController.name);

  constructor(private readonly boardMembersService: BoardMembersService) {}

  // NOTE: L'ajout direct de membres est désactivé en faveur du système d'invitation
  // Les membres sont ajoutés automatiquement lors de l'acceptation d'une invitation
  // Utilisez POST /invitations/boards/:boardId pour inviter des membres

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

  @Patch(':userId/permissions')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Modifier les permissions d'un utilisateur",
    description:
      "Met à jour uniquement les permissions d'un utilisateur membre",
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'userId',
    description: "Identifiant UUID de l'utilisateur",
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiBody({ type: UpdateBoardMemberPermissionDto })
  @ApiResponse({
    status: 200,
    description: "Permissions de l'utilisateur mises à jour avec succès",
    type: BoardMemberResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Permission invalide',
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
    description: 'Board ou utilisateur non trouvé comme membre',
  })
  async updateUserPermission(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Param('userId', UuidValidationPipe) userId: string,
    @Body() updatePermissionDto: UpdateBoardMemberPermissionDto,
    @Request() req: { user: JwtUser },
  ): Promise<BoardMemberResponseDto> {
    this.logger.log(
      `Mise à jour des permissions de l'utilisateur ${userId} du board ${boardId} par ${req.user.id}`,
    );
    const member = await this.boardMembersService.updateUserPermission(
      boardId,
      userId,
      updatePermissionDto,
      req.user.id,
    );
    this.logger.log(
      `Permissions de l'utilisateur ${userId} mises à jour avec succès`,
    );
    return member;
  }

  @Delete(':userId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Retirer un utilisateur du board',
    description:
      'Supprime un utilisateur du board (propriétaire et admin uniquement)',
  })
  @ApiParam({
    name: 'boardId',
    description: 'Identifiant UUID du board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'userId',
    description: "Identifiant UUID de l'utilisateur",
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
    description: 'Board ou utilisateur non trouvé',
  })
  async remove(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Param('userId', UuidValidationPipe) userId: string,
    @Request() req: { user: JwtUser },
  ): Promise<void> {
    this.logger.log(
      `Suppression de l'utilisateur ${userId} du board ${boardId} par l'utilisateur ${req.user.id}`,
    );
    await this.boardMembersService.removeByUserId(boardId, userId, req.user.id);
    this.logger.log(
      `Utilisateur ${userId} supprimé avec succès du board ${boardId}`,
    );
  }
}
