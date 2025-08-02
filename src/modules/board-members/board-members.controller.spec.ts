import { Test, TestingModule } from '@nestjs/testing';
import { BoardMembersController } from './board-members.controller';
import { BoardMembersService } from './board-members.service';
import { BoardMemberPermission } from './enums/board-member.enum';

describe('BoardMembersController', () => {
  let controller: BoardMembersController;
  let service: jest.Mocked<BoardMembersService>;

  const mockBoardMembersService = {
    create: jest.fn(),
    findBoardMembers: jest.fn(),
    updateUserPermission: jest.fn(),
    removeByUserId: jest.fn(),
  };

  const mockJwtUser = { id: 'user-123' };
  const mockRequest = { user: mockJwtUser };

  const mockBoardMemberResponse = {
    id: 'member-123',
    permissionLevel: BoardMemberPermission.VIEW,
    user: {
      id: 'user-456',
      displayName: 'Test User',
      isActive: true,
    },
    status: {
      id: 'board-member-active',
      category: 'board-member',
      name: 'active',
      isActive: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardMembersController],
      providers: [
        {
          provide: BoardMembersService,
          useValue: mockBoardMembersService,
        },
      ],
    }).compile();

    controller = module.get<BoardMembersController>(BoardMembersController);
    service = module.get<BoardMembersService>(
      BoardMembersService,
    ) as jest.Mocked<BoardMembersService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // NOTE: La méthode create a été supprimée en faveur du système d'invitation
  // Les membres sont ajoutés automatiquement lors de l'acceptation d'une invitation

  describe('findAll', () => {
    it('should return board members', async () => {
      // Arrange
      const members = [mockBoardMemberResponse];
      service.findBoardMembers.mockResolvedValue(members);

      // Act
      const result = await controller.findAll('board-123', mockRequest as any);

      // Assert
      expect(result).toEqual(members);
      expect(service.findBoardMembers).toHaveBeenCalledWith(
        'board-123',
        'user-123',
      );
    });

    it('should return empty array when no members', async () => {
      // Arrange
      service.findBoardMembers.mockResolvedValue([]);

      // Act
      const result = await controller.findAll('board-123', mockRequest as any);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('updateUserPermission', () => {
    const updateDto = {
      permissionLevel: BoardMemberPermission.EDIT,
    };

    it('should update user permissions successfully', async () => {
      // Arrange
      const updatedMember = {
        ...mockBoardMemberResponse,
        permissionLevel: BoardMemberPermission.EDIT,
      };
      service.updateUserPermission.mockResolvedValue(updatedMember);

      // Act
      const result = await controller.updateUserPermission(
        'board-123',
        'user-456',
        updateDto,
        mockRequest as any,
      );

      // Assert
      expect(result).toEqual(updatedMember);
      expect(service.updateUserPermission).toHaveBeenCalledWith(
        'board-123',
        'user-456',
        updateDto,
        'user-123',
      );
    });

    it('should propagate service errors', async () => {
      // Arrange
      const error = new Error('Update permission error');
      service.updateUserPermission.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.updateUserPermission(
          'board-123',
          'user-456',
          updateDto,
          mockRequest as any,
        ),
      ).rejects.toThrow('Update permission error');
    });
  });

  describe('remove', () => {
    it('should remove user from board successfully', async () => {
      // Arrange
      service.removeByUserId.mockResolvedValue(undefined);

      // Act
      await controller.remove('board-123', 'user-456', mockRequest as any);

      // Assert
      expect(service.removeByUserId).toHaveBeenCalledWith(
        'board-123',
        'user-456',
        'user-123',
      );
    });

    it('should propagate service errors', async () => {
      // Arrange
      const error = new Error('Remove error');
      service.removeByUserId.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.remove('board-123', 'user-456', mockRequest as any),
      ).rejects.toThrow('Remove error');
    });
  });
});
