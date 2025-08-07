import { Test, TestingModule } from '@nestjs/testing';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { InvitationResponseDto } from './dto/invitation-response.dto';
import { InvitationPermission } from './enums/invitation.enum';

describe('InvitationController', () => {
  let controller: InvitationController;
  let service: InvitationService;

  const mockInvitationResponse: InvitationResponseDto = {
    id: 'invitation-123',
    boardId: 'board-123',
    email: 'test@example.com',
    permissionLevel: InvitationPermission.VIEW,
    invitedBy: 'user-123',
    expiresAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitationController],
      providers: [
        {
          provide: InvitationService,
          useValue: {
            create: jest.fn(),
            findBoardInvitations: jest.fn(),
            acceptInvitationPublic: jest.fn(),
            deleteInvitation: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InvitationController>(InvitationController);
    service = module.get<InvitationService>(InvitationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createInvitation', () => {
    it('should create invitation successfully', async () => {
      // Arrange
      const boardId = 'board-123';
      const createInvitationDto: CreateInvitationDto = {
        email: 'new@example.com',
        permissionLevel: InvitationPermission.EDIT,
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockInvitationResponse);

      // Act
      const result = await controller.createInvitation(
        boardId,
        createInvitationDto,
        mockRequest as any,
      );

      // Assert
      expect(result).toEqual(mockInvitationResponse);
      expect(service.create).toHaveBeenCalledWith(
        boardId,
        createInvitationDto,
        mockRequest.user.id,
      );
    });
  });

  describe('getBoardInvitations', () => {
    it('should return board invitations', async () => {
      // Arrange
      const boardId = 'board-123';
      const invitations = [mockInvitationResponse];

      jest
        .spyOn(service, 'findBoardInvitations')
        .mockResolvedValue(invitations);

      // Act
      const result = await controller.getBoardInvitations(
        boardId,
        mockRequest as any,
      );

      // Assert
      expect(result).toEqual(invitations);
      expect(service.findBoardInvitations).toHaveBeenCalledWith(
        boardId,
        mockRequest.user.id,
      );
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation successfully', async () => {
      // Arrange
      const acceptInvitationDto: AcceptInvitationDto = {
        token: 'valid-token',
      };
      const expectedResponse = {
        message: 'Invitation acceptée avec succès',
        boardId: 'board-123',
        userExists: true,
        boardName: 'Test Board',
      };

      jest
        .spyOn(service, 'acceptInvitationPublic')
        .mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.acceptInvitation(acceptInvitationDto);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(service.acceptInvitationPublic).toHaveBeenCalledWith(
        acceptInvitationDto,
      );
    });
  });

  describe('deleteInvitation', () => {
    it('should delete invitation successfully', async () => {
      // Arrange
      const invitationId = 'invitation-123';

      jest.spyOn(service, 'deleteInvitation').mockResolvedValue(undefined);

      // Act
      await controller.deleteInvitation(invitationId, mockRequest as any);

      // Assert
      expect(service.deleteInvitation).toHaveBeenCalledWith(
        invitationId,
        mockRequest.user.id,
      );
    });
  });
});
