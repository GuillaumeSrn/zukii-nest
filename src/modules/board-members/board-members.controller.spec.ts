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
    update: jest.fn(),
    remove: jest.fn(),
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

  describe('create', () => {
    const createDto = {
      email: 'test@example.com',
      permissionLevel: BoardMemberPermission.VIEW,
    };

    it('should create a board member successfully', async () => {
      // Arrange
      service.create.mockResolvedValue(mockBoardMemberResponse);

      // Act
      const result = await controller.create(
        'board-123',
        createDto,
        mockRequest as any,
      );

      // Assert
      expect(result).toEqual(mockBoardMemberResponse);
      expect(service.create).toHaveBeenCalledWith(
        'board-123',
        createDto,
        'user-123',
      );
    });

    it('should propagate service errors', async () => {
      // Arrange
      const error = new Error('Service error');
      service.create.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.create('board-123', createDto, mockRequest as any),
      ).rejects.toThrow('Service error');
    });
  });

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

  describe('update', () => {
    const updateDto = {
      permissionLevel: BoardMemberPermission.EDIT,
    };

    it('should update board member successfully', async () => {
      // Arrange
      const updatedMember = {
        ...mockBoardMemberResponse,
        permissionLevel: BoardMemberPermission.EDIT,
      };
      service.update.mockResolvedValue(updatedMember);

      // Act
      const result = await controller.update(
        'board-123',
        'member-123',
        updateDto,
        mockRequest as any,
      );

      // Assert
      expect(result).toEqual(updatedMember);
      expect(service.update).toHaveBeenCalledWith(
        'board-123',
        'member-123',
        updateDto,
        'user-123',
      );
    });

    it('should propagate service errors', async () => {
      // Arrange
      const error = new Error('Update error');
      service.update.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update(
          'board-123',
          'member-123',
          updateDto,
          mockRequest as any,
        ),
      ).rejects.toThrow('Update error');
    });
  });

  describe('remove', () => {
    it('should remove board member successfully', async () => {
      // Arrange
      service.remove.mockResolvedValue(undefined);

      // Act
      await controller.remove('board-123', 'member-123', mockRequest as any);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(
        'board-123',
        'member-123',
        'user-123',
      );
    });

    it('should propagate service errors', async () => {
      // Arrange
      const error = new Error('Remove error');
      service.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.remove('board-123', 'member-123', mockRequest as any),
      ).rejects.toThrow('Remove error');
    });
  });
});
