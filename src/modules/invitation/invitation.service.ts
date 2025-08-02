import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Invitation } from './entities/invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationResponseDto } from './dto/invitation-response.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { Board } from '../boards/entities/board.entity';
import { User } from '../users/entities/user.entity';
import { BoardMember } from '../board-members/entities/board-member.entity';
import { InvitationPermission } from './enums/invitation.enum';
import { BoardMemberPermission } from '../board-members/enums/board-member.enum';
import { EmailService } from '../email/email.service';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(BoardMember)
    private readonly boardMemberRepository: Repository<BoardMember>,
    private readonly emailService: EmailService,
  ) {}

  async create(
    boardId: string,
    createInvitationDto: CreateInvitationDto,
    currentUserId: string,
  ): Promise<InvitationResponseDto> {
    this.logger.log(
      `Création d'une invitation pour le board ${boardId} par l'utilisateur ${currentUserId}`,
    );

    const board = await this.findBoardEntity(boardId);
    await this.validatePermission(board, currentUserId);

    // Vérifier que l'utilisateur ne s'invite pas lui-même
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new NotFoundException('Utilisateur invitant non trouvé');
    }

    if (currentUser.email === createInvitationDto.email) {
      throw new BadRequestException(
        'Vous ne pouvez pas vous inviter vous-même à un board',
      );
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = await this.boardMemberRepository.findOne({
      where: {
        boardId,
        user: { email: createInvitationDto.email },
      },
      relations: ['user'],
    });

    if (existingMember) {
      throw new ConflictException('Cet utilisateur est déjà membre du board');
    }

    // Vérifier si une invitation existe déjà et n'est pas expirée
    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        boardId,
        email: createInvitationDto.email,
      },
    });

    if (existingInvitation && existingInvitation.expiresAt > new Date()) {
      throw new ConflictException(
        "Une invitation active existe déjà pour cet email, veuillez attendre que l'invitation expire.",
      );
    }

    // Si une invitation expirée existe, la supprimer
    if (existingInvitation && existingInvitation.expiresAt <= new Date()) {
      this.logger.log(
        `Suppression de l'invitation expirée: ${existingInvitation.id}`,
      );
      await this.invitationRepository.remove(existingInvitation);
    }

    // Générer un token unique
    const invitationToken = this.generateInvitationToken();

    // Définir l'expiration (1 jour par défaut)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    const invitation = this.invitationRepository.create({
      boardId,
      email: createInvitationDto.email,
      permissionLevel:
        createInvitationDto.permissionLevel || InvitationPermission.VIEW,
      invitationToken,
      invitedBy: currentUserId,
      expiresAt,
    });

    const savedInvitation = await this.invitationRepository.save(invitation);

    // Envoyer l'email d'invitation
    try {
      await this.sendInvitationEmail(savedInvitation, board);
      this.logger.log(`Email d'invitation envoyé à ${savedInvitation.email}`);
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'envoi de l'email d'invitation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
      // On ne fait pas échouer la création de l'invitation si l'email échoue
    }

    this.logger.log(`Invitation créée avec succès: ${savedInvitation.id}`);
    return this.toInvitationResponseDto(savedInvitation);
  }

  async findBoardInvitations(
    boardId: string,
    currentUserId: string,
  ): Promise<InvitationResponseDto[]> {
    this.logger.log(
      `Récupération des invitations pour le board ${boardId} par l'utilisateur ${currentUserId}`,
    );

    const board = await this.findBoardEntity(boardId);
    await this.validatePermission(board, currentUserId);

    const invitations = await this.invitationRepository.find({
      where: { boardId },
      relations: ['invitedByUser'],
      order: { createdAt: 'DESC' },
    });

    return invitations.map((invitation) =>
      this.toInvitationResponseDto(invitation),
    );
  }

  async acceptInvitation(
    acceptInvitationDto: AcceptInvitationDto,
    currentUserId: string,
  ): Promise<{ message: string; boardId: string }> {
    this.logger.log(
      `Acceptation d'une invitation par l'utilisateur ${currentUserId}`,
    );

    const invitation = await this.invitationRepository.findOne({
      where: { invitationToken: acceptInvitationDto.token },
      relations: ['board'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation non trouvée');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Cette invitation a expiré');
    }

    // Vérifier que l'utilisateur accepte pour son propre email
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (currentUser.email !== invitation.email) {
      throw new ForbiddenException(
        'Vous ne pouvez accepter que vos propres invitations',
      );
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = await this.boardMemberRepository.findOne({
      where: {
        boardId: invitation.boardId,
        userId: currentUserId,
      },
    });

    if (existingMember) {
      throw new ConflictException('Vous êtes déjà membre de ce board');
    }

    // Créer le BoardMember
    const boardMember = this.boardMemberRepository.create({
      boardId: invitation.boardId,
      userId: currentUserId,
      permissionLevel: this.mapInvitationPermissionToBoardMemberPermission(
        invitation.permissionLevel,
      ),
      updatedBy: currentUserId,
    });

    await this.boardMemberRepository.save(boardMember);

    // Supprimer l'invitation
    await this.invitationRepository.remove(invitation);

    this.logger.log(
      `Invitation acceptée avec succès pour le board ${invitation.boardId}`,
    );

    return {
      message: 'Invitation acceptée avec succès',
      boardId: invitation.boardId,
    };
  }

  async acceptInvitationPublic(
    acceptInvitationDto: AcceptInvitationDto,
  ): Promise<{
    message: string;
    boardId: string;
  }> {
    this.logger.log("Acceptation publique d'une invitation");

    const invitation = await this.invitationRepository.findOne({
      where: { invitationToken: acceptInvitationDto.token },
      relations: ['board'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation non trouvée');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Cette invitation a expiré');
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userRepository.findOne({
      where: { email: invitation.email },
    });

    if (existingUser) {
      // L'utilisateur existe, on peut créer le BoardMember
      const existingMember = await this.boardMemberRepository.findOne({
        where: {
          boardId: invitation.boardId,
          userId: existingUser.id,
        },
      });

      if (existingMember) {
        throw new ConflictException('Vous êtes déjà membre de ce board');
      }

      // Créer le BoardMember
      const boardMember = this.boardMemberRepository.create({
        boardId: invitation.boardId,
        userId: existingUser.id,
        permissionLevel: this.mapInvitationPermissionToBoardMemberPermission(
          invitation.permissionLevel,
        ),
        statusId: 'board-member-active', // Statut par défaut pour les membres actifs
      });

      await this.boardMemberRepository.save(boardMember);

      // Supprimer l'invitation car l'utilisateur existe
      await this.invitationRepository.remove(invitation);

      this.logger.log(
        `Invitation acceptée et BoardMember créé pour ${existingUser.email}`,
      );
    } else {
      // L'utilisateur n'existe pas encore, on garde l'invitation active
      // Elle sera traitée lors de l'inscription de l'utilisateur
      this.logger.log(
        `Invitation acceptée pour utilisateur non enregistré: ${invitation.email}. L'invitation reste active.`,
      );
    }

    return {
      message:
        'Invitation acceptée avec succès ! Vous pouvez maintenant accéder au board.',
      boardId: invitation.boardId,
    };
  }

  async deleteInvitation(
    invitationId: string,
    currentUserId: string,
  ): Promise<void> {
    this.logger.log(
      `Suppression de l'invitation ${invitationId} par l'utilisateur ${currentUserId}`,
    );

    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['board'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation non trouvée');
    }

    await this.validatePermission(invitation.board, currentUserId);

    await this.invitationRepository.remove(invitation);

    this.logger.log(`Invitation supprimée avec succès: ${invitationId}`);
  }

  async processPendingInvitations(
    email: string,
    userId: string,
  ): Promise<void> {
    this.logger.log(`Traitement des invitations en attente pour ${email}`);

    // Récupérer toutes les invitations en attente pour cet email
    const pendingInvitations = await this.invitationRepository.find({
      where: { email },
      relations: ['board'],
    });

    for (const invitation of pendingInvitations) {
      try {
        // Vérifier si l'invitation n'a pas expiré
        if (invitation.expiresAt < new Date()) {
          this.logger.log(
            `Invitation expirée pour ${email} sur le board ${invitation.boardId}`,
          );
          await this.invitationRepository.remove(invitation);
          continue;
        }

        // Vérifier si l'utilisateur n'est pas déjà membre
        const existingMember = await this.boardMemberRepository.findOne({
          where: {
            boardId: invitation.boardId,
            userId: userId,
          },
        });

        if (existingMember) {
          this.logger.log(
            `Utilisateur ${email} déjà membre du board ${invitation.boardId}`,
          );
          await this.invitationRepository.remove(invitation);
          continue;
        }

        // Créer le BoardMember
        const boardMember = this.boardMemberRepository.create({
          boardId: invitation.boardId,
          userId: userId,
          permissionLevel: this.mapInvitationPermissionToBoardMemberPermission(
            invitation.permissionLevel,
          ),
          statusId: 'board-member-active',
        });

        await this.boardMemberRepository.save(boardMember);

        // Supprimer l'invitation
        await this.invitationRepository.remove(invitation);

        this.logger.log(
          `BoardMember créé pour ${email} sur le board ${invitation.boardId}`,
        );
      } catch (error) {
        this.logger.error(
          `Erreur lors du traitement de l'invitation pour ${email} sur le board ${invitation.boardId}: ${error.message}`,
        );
      }
    }
  }

  private async findBoardEntity(boardId: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Board non trouvé');
    }

    return board;
  }

  private async validatePermission(
    board: Board,
    currentUserId: string,
  ): Promise<void> {
    // Le propriétaire du board peut toujours gérer les invitations
    if (board.ownerId === currentUserId) {
      return;
    }

    // Vérifier les permissions de membre
    const boardMember = await this.boardMemberRepository.findOne({
      where: {
        boardId: board.id,
        userId: currentUserId,
      },
    });

    if (
      !boardMember ||
      boardMember.permissionLevel !== BoardMemberPermission.ADMIN
    ) {
      throw new ForbiddenException(
        'Vous devez être propriétaire ou administrateur pour gérer les invitations',
      );
    }
  }

  private generateInvitationToken(): string {
    return randomBytes(32).toString('hex');
  }

  private mapInvitationPermissionToBoardMemberPermission(
    invitationPermission: InvitationPermission,
  ): BoardMemberPermission {
    switch (invitationPermission) {
      case InvitationPermission.VIEW:
        return BoardMemberPermission.VIEW;
      case InvitationPermission.EDIT:
        return BoardMemberPermission.EDIT;
      case InvitationPermission.ADMIN:
        return BoardMemberPermission.ADMIN;
      default:
        return BoardMemberPermission.VIEW;
    }
  }

  private async sendInvitationEmail(
    invitation: Invitation,
    board: Board,
  ): Promise<void> {
    const invitedByUser = await this.userRepository.findOne({
      where: { id: invitation.invitedBy },
    });

    if (!invitedByUser) {
      throw new Error('Utilisateur invitant non trouvé');
    }

    const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/invitation/${invitation.invitationToken}`;

    const mailOptions = {
      to: invitation.email,
      subject: `🎯 Invitation à rejoindre le board "${board.title}" sur Zukii`,
      html: this.getInvitationEmailTemplate(
        invitation,
        board,
        invitedByUser,
        invitationUrl,
      ),
      text: `Vous avez été invité(e) par ${invitedByUser.displayName} à rejoindre le board "${board.title}" sur Zukii. Cliquez sur ce lien pour accepter l'invitation : ${invitationUrl}`,
    };

    await this.emailService['mailerService'].sendMail(mailOptions);
  }

  private getInvitationEmailTemplate(
    invitation: Invitation,
    board: Board,
    invitedByUser: User,
    invitationUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation Zukii</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .btn { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Invitation Zukii</h1>
            <p>Vous avez été invité(e) à rejoindre un board collaboratif</p>
          </div>
          <div class="content">
            <h2>Bonjour ! 👋</h2>
            <p><strong>${invitedByUser.displayName}</strong> vous invite à rejoindre le board :</p>
            <h3>📊 ${board.title}</h3>
            <p>${board.description || "Board collaboratif d'analyse de données"}</p>
            <p><strong>Niveau d'accès :</strong> ${invitation.permissionLevel.toUpperCase()}</p>
            <p><strong>Expire le :</strong> ${invitation.expiresAt.toLocaleDateString('fr-FR')}</p>
            <div style="text-align: center;color: white;">
              <a href="${invitationUrl}" class="btn">✅ Accepter l'invitation</a>
            </div>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Cette invitation expire le ${invitation.expiresAt.toLocaleDateString('fr-FR')}. 
              Si vous ne pouvez pas cliquer sur le bouton, copiez ce lien : ${invitationUrl}
            </p>
          </div>
          <div class="footer">
            <p><strong>Zukii</strong> - Plateforme collaborative d'analyse de données</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private toInvitationResponseDto(
    invitation: Invitation,
  ): InvitationResponseDto {
    return {
      id: invitation.id,
      boardId: invitation.boardId,
      email: invitation.email,
      permissionLevel: invitation.permissionLevel,
      invitedBy: invitation.invitedBy,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
      board: invitation.board
        ? {
            id: invitation.board.id,
            title: invitation.board.title,
          }
        : undefined,
      invitedByUser: invitation.invitedByUser
        ? {
            id: invitation.invitedByUser.id,
            displayName: invitation.invitedByUser.displayName,
          }
        : undefined,
    };
  }
}
