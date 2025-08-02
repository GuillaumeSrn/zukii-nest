import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { InvitationResponseDto } from './dto/invitation-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post('boards/:boardId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Créer une invitation pour un board',
    description:
      'Crée une invitation pour permettre à un utilisateur de rejoindre un board',
  })
  @ApiParam({ name: 'boardId', description: 'ID du board' })
  @ApiResponse({
    status: 201,
    description: 'Invitation créée avec succès',
    type: InvitationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Board non trouvé' })
  @ApiResponse({ status: 409, description: 'Invitation déjà existante' })
  async createInvitation(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Body() createInvitationDto: CreateInvitationDto,
    @Request() req: { user: JwtUser },
  ): Promise<InvitationResponseDto> {
    return this.invitationService.create(
      boardId,
      createInvitationDto,
      req.user.id,
    );
  }

  @Get('boards/:boardId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Récupérer les invitations d'un board",
    description: 'Récupère la liste des invitations en cours pour un board',
  })
  @ApiParam({ name: 'boardId', description: 'ID du board' })
  @ApiResponse({
    status: 200,
    description: 'Liste des invitations',
    type: [InvitationResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Board non trouvé' })
  async getBoardInvitations(
    @Param('boardId', UuidValidationPipe) boardId: string,
    @Request() req: { user: JwtUser },
  ): Promise<InvitationResponseDto[]> {
    return this.invitationService.findBoardInvitations(boardId, req.user.id);
  }

  @Public()
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accepter une invitation',
    description:
      'Accepte une invitation pour rejoindre un board (route publique)',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation acceptée avec succès',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        boardId: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token invalide ou invitation expirée',
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Invitation non trouvée' })
  @ApiResponse({ status: 409, description: 'Déjà membre du board' })
  async acceptInvitation(
    @Body() acceptInvitationDto: AcceptInvitationDto,
  ): Promise<{ message: string; boardId: string }> {
    // Pour l'acceptation publique, on ne peut pas récupérer l'utilisateur depuis le JWT
    // Le service devra gérer cela différemment
    return this.invitationService.acceptInvitationPublic(acceptInvitationDto);
  }

  @Delete(':invitationId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une invitation',
    description: 'Supprime une invitation en cours',
  })
  @ApiParam({ name: 'invitationId', description: "ID de l'invitation" })
  @ApiResponse({ status: 204, description: 'Invitation supprimée' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Invitation non trouvée' })
  async deleteInvitation(
    @Param('invitationId', UuidValidationPipe) invitationId: string,
    @Request() req: { user: JwtUser },
  ): Promise<void> {
    return this.invitationService.deleteInvitation(invitationId, req.user.id);
  }
}
