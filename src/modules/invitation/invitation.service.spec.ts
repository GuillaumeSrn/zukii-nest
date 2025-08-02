import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvitationService } from './invitation.service';
import { Invitation } from './entities/invitation.entity';
import { Board } from '../boards/entities/board.entity';
import { User } from '../users/entities/user.entity';
import { BoardMember } from '../board-members/entities/board-member.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { InvitationPermission } from './enums/invitation.enum';
import { BoardMemberPermission } from '../board-members/enums/board-member.enum';
import { EmailService } from '../email/email.service';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('InvitationService - CRITICAL Collaboration Module', () => {
  let service: InvitationService;
  let invitationRepository: Repository<Invitation>;
  let boardRepository: Repository<Board>;
  let userRepository: Repository<User>;
  let boardMemberRepository: Repository<BoardMember>;

  const mockBoard: Board = {
    id: 'board-123',
    title: 'Test Board',
    description: 'Test Description',
    ownerId: 'owner-123',
    statusId: 'active',
    backgroundColor: '#ffffff',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Board;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    passwordHash: 'hashed-password',
    statusId: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockInvitation: Invitation = {
    id: 'invitation-123',
    boardId: 'board-123',
    email: 'invited@example.com',
    permissionLevel: InvitationPermission.VIEW,
    invitationToken: 'token-123',
    invitedBy: 'user-123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Invitation;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationService,
        {
          provide: getRepositoryToken(Invitation),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Board),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BoardMember),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendWelcome: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InvitationService>(InvitationService);
    invitationRepository = module.get<Repository<Invitation>>(
      getRepositoryToken(Invitation),
    );
    boardRepository = module.get<Repository<Board>>(getRepositoryToken(Board));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    boardMemberRepository = module.get<Repository<BoardMember>>(
      getRepositoryToken(BoardMember),
    );
  });

  describe('CRITICAL - Invitation Creation', () => {
    it('CRITICAL - should create invitation successfully when user is board owner', async () => {
      // Arrange
      const createInvitationDto: CreateInvitationDto = {
        email: 'new@example.com',
        permissionLevel: InvitationPermission.EDIT,
      };
      const currentUserId = 'owner-123';

      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(mockBoard);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(boardMemberRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(invitationRepository, 'create')
        .mockReturnValue(mockInvitation);
      jest
        .spyOn(invitationRepository, 'save')
        .mockResolvedValue(mockInvitation);

      // Act
      const result = await service.create(
        'board-123',
        createInvitationDto,
        currentUserId,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe('invited@example.com');
      expect(invitationRepository.create).toHaveBeenCalled();
      expect(invitationRepository.save).toHaveBeenCalled();
    });

    it('CRITICAL - should reject invitation creation when user is not owner or admin', async () => {
      // Arrange
      const createInvitationDto: CreateInvitationDto = {
        email: 'new@example.com',
      };
      const currentUserId = 'user-456';

      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(mockBoard);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(boardMemberRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.create('board-123', createInvitationDto, currentUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('CRITICAL - should reject invitation when user is already member', async () => {
      // Arrange
      const createInvitationDto: CreateInvitationDto = {
        email: 'existing@example.com',
      };
      const currentUserId = 'owner-123';

      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(mockBoard);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(boardMemberRepository, 'findOne').mockResolvedValue({
        id: 'member-123',
        boardId: 'board-123',
        userId: 'user-456',
        permissionLevel: BoardMemberPermission.VIEW,
      } as BoardMember);

      // Act & Assert
      await expect(
        service.create('board-123', createInvitationDto, currentUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('CRITICAL - should reject invitation when active invitation already exists', async () => {
      // Arrange
      const createInvitationDto: CreateInvitationDto = {
        email: 'invited@example.com',
      };
      const currentUserId = 'owner-123';

      const activeInvitation = {
        ...mockInvitation,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expire dans 1 jour
      };

      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(mockBoard);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(boardMemberRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(invitationRepository, 'findOne')
        .mockResolvedValue(activeInvitation);

      // Act & Assert
      await expect(
        service.create('board-123', createInvitationDto, currentUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('CRITICAL - should allow re-invitation when previous invitation is expired', async () => {
      // Arrange
      const createInvitationDto: CreateInvitationDto = {
        email: 'invited@example.com',
      };
      const currentUserId = 'owner-123';

      const expiredInvitation = {
        ...mockInvitation,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expirée depuis 1 jour
      };

      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(mockBoard);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(boardMemberRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(invitationRepository, 'findOne')
        .mockResolvedValue(expiredInvitation);
      jest
        .spyOn(invitationRepository, 'remove')
        .mockResolvedValue(expiredInvitation as any);
      jest
        .spyOn(invitationRepository, 'create')
        .mockReturnValue(mockInvitation);
      jest
        .spyOn(invitationRepository, 'save')
        .mockResolvedValue(mockInvitation);

      // Act
      const result = await service.create(
        'board-123',
        createInvitationDto,
        currentUserId,
      );

      // Assert
      expect(result).toBeDefined();
      expect(invitationRepository.remove).toHaveBeenCalledWith(
        expiredInvitation,
      );
      expect(invitationRepository.create).toHaveBeenCalled();
      expect(invitationRepository.save).toHaveBeenCalled();
    });
  });

  describe('CRITICAL - Invitation Acceptance', () => {
    it('CRITICAL - should accept invitation successfully with valid token', async () => {
      // Arrange
      const acceptInvitationDto: AcceptInvitationDto = {
        token: 'valid-token',
      };
      const currentUserId = 'user-456';
      const currentUser = {
        ...mockUser,
        id: currentUserId,
        email: 'invited@example.com',
      };

      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue({
        ...mockInvitation,
        email: 'invited@example.com',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 jour
      });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(currentUser);
      jest.spyOn(boardMemberRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(boardMemberRepository, 'create').mockReturnValue({
        id: 'member-123',
        boardId: 'board-123',
        userId: currentUserId,
        permissionLevel: BoardMemberPermission.VIEW,
      } as BoardMember);
      jest
        .spyOn(boardMemberRepository, 'save')
        .mockResolvedValue({} as BoardMember);
      jest
        .spyOn(invitationRepository, 'remove')
        .mockResolvedValue({} as Invitation);

      // Act
      const result = await service.acceptInvitation(
        acceptInvitationDto,
        currentUserId,
      );

      // Assert
      expect(result.message).toBe('Invitation acceptée avec succès');
      expect(result.boardId).toBe('board-123');
      expect(boardMemberRepository.create).toHaveBeenCalled();
      expect(boardMemberRepository.save).toHaveBeenCalled();
      expect(invitationRepository.remove).toHaveBeenCalled();
    });

    it('CRITICAL - should reject expired invitation', async () => {
      // Arrange
      const acceptInvitationDto: AcceptInvitationDto = {
        token: 'expired-token',
      };
      const currentUserId = 'user-456';

      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue({
        ...mockInvitation,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 jour dans le passé
      });

      // Act & Assert
      await expect(
        service.acceptInvitation(acceptInvitationDto, currentUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('CRITICAL - should reject invitation for wrong email', async () => {
      // Arrange
      const acceptInvitationDto: AcceptInvitationDto = {
        token: 'valid-token',
      };
      const currentUserId = 'user-456';
      const currentUser = {
        ...mockUser,
        id: currentUserId,
        email: 'wrong@example.com',
      };

      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue({
        ...mockInvitation,
        email: 'invited@example.com',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(currentUser);

      // Act & Assert
      await expect(
        service.acceptInvitation(acceptInvitationDto, currentUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('CRITICAL - should reject invitation when user is already member', async () => {
      // Arrange
      const acceptInvitationDto: AcceptInvitationDto = {
        token: 'valid-token',
      };
      const currentUserId = 'user-456';
      const currentUser = {
        ...mockUser,
        id: currentUserId,
        email: 'invited@example.com',
      };

      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue({
        ...mockInvitation,
        email: 'invited@example.com',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(currentUser);
      jest.spyOn(boardMemberRepository, 'findOne').mockResolvedValue({
        id: 'member-123',
        boardId: 'board-123',
        userId: currentUserId,
        permissionLevel: BoardMemberPermission.VIEW,
      } as BoardMember);

      // Act & Assert
      await expect(
        service.acceptInvitation(acceptInvitationDto, currentUserId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('CRITICAL - Permission Validation', () => {
    it('CRITICAL - should allow admin members to manage invitations', async () => {
      // Arrange
      const createInvitationDto: CreateInvitationDto = {
        email: 'new@example.com',
      };
      const currentUserId = 'admin-123';

      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(mockBoard);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      // Mock pour vérifier les permissions de l'admin
      jest
        .spyOn(boardMemberRepository, 'findOne')
        .mockResolvedValueOnce({
          id: 'member-123',
          boardId: 'board-123',
          userId: currentUserId,
          permissionLevel: BoardMemberPermission.ADMIN,
        } as BoardMember)
        .mockResolvedValueOnce(null); // L'utilisateur invité n'est pas encore membre
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(invitationRepository, 'create')
        .mockReturnValue(mockInvitation);
      jest
        .spyOn(invitationRepository, 'save')
        .mockResolvedValue(mockInvitation);

      // Act
      const result = await service.create(
        'board-123',
        createInvitationDto,
        currentUserId,
      );

      // Assert
      expect(result).toBeDefined();
    });

    it('CRITICAL - should reject non-admin members from managing invitations', async () => {
      // Arrange
      const createInvitationDto: CreateInvitationDto = {
        email: 'new@example.com',
      };
      const currentUserId = 'member-123';

      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(mockBoard);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(boardMemberRepository, 'findOne').mockResolvedValue({
        id: 'member-123',
        boardId: 'board-123',
        userId: currentUserId,
        permissionLevel: BoardMemberPermission.VIEW,
      } as BoardMember);

      // Act & Assert
      await expect(
        service.create('board-123', createInvitationDto, currentUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
