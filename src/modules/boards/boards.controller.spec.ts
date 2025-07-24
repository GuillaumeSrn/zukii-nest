import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

describe('BoardsController', () => {
  let controller: BoardsController;
  let service: jest.Mocked<BoardsService>;

  const mockBoardResponse = {
    id: 'board-123',
    title: 'Test Board',
    description: 'Test Description',
    backgroundColor: '#FFFFFF',
    updatedAt: new Date(),
    owner: {
      id: 'user-123',
      displayName: 'Test User',
      isActive: true,
    },
    status: {
      id: 'board-active',
      category: 'board',
      name: 'active',
      isActive: true,
    },
  };

  const mockAuthRequest = {
    user: {
      id: 'user-mock-id',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardsController],
      providers: [
        {
          provide: BoardsService,
          useValue: {
            create: jest.fn(),
            findMyBoards: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BoardsController>(BoardsController);
    service = module.get(BoardsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create board successfully', async () => {
      const createBoardDto: CreateBoardDto = {
        title: 'Test Board',
        description: 'Test Description',
        backgroundColor: '#FFFFFF',
      };

      service.create.mockResolvedValue(mockBoardResponse);

      const result = await controller.create(createBoardDto, mockAuthRequest);

      expect(service.create).toHaveBeenCalledWith(
        createBoardDto,
        mockAuthRequest.user.id,
      );
      expect(result).toBe(mockBoardResponse);
    });

    it('should propagate NotFoundException when user not found', async () => {
      const createBoardDto: CreateBoardDto = {
        title: 'Test Board',
      };

      const notFoundError = new NotFoundException('Utilisateur non trouvé');
      service.create.mockRejectedValue(notFoundError);

      await expect(
        controller.create(createBoardDto, mockAuthRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ConflictException when status unavailable', async () => {
      const createBoardDto: CreateBoardDto = {
        title: 'Test Board',
      };

      const conflictError = new ConflictException(
        'Statut par défaut non disponible',
      );
      service.create.mockRejectedValue(conflictError);

      await expect(
        controller.create(createBoardDto, mockAuthRequest),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findMyBoards', () => {
    it('should return user boards successfully', async () => {
      const mockBoards = [mockBoardResponse];
      service.findMyBoards.mockResolvedValue(mockBoards);

      const result = await controller.findMyBoards(mockAuthRequest);

      expect(service.findMyBoards).toHaveBeenCalledWith(
        mockAuthRequest.user.id,
      );
      expect(result).toBe(mockBoards);
    });

    it('should return empty array when user has no boards', async () => {
      service.findMyBoards.mockResolvedValue([]);

      const result = await controller.findMyBoards(mockAuthRequest);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return board successfully', async () => {
      const boardId = 'board-mock-id';
      service.findById.mockResolvedValue(mockBoardResponse);

      const result = await controller.findOne(boardId, mockAuthRequest);

      expect(service.findById).toHaveBeenCalledWith(
        boardId,
        mockAuthRequest.user.id,
      );
      expect(result).toBe(mockBoardResponse);
    });

    it('should propagate NotFoundException when board not found', async () => {
      const boardId = 'non-existent-id';
      const notFoundError = new NotFoundException('Board non trouvé');
      service.findById.mockRejectedValue(notFoundError);

      await expect(
        controller.findOne(boardId, mockAuthRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException when user not owner', async () => {
      const boardId = 'board-mock-id';
      const forbiddenError = new ForbiddenException(
        'Accès non autorisé à ce board',
      );
      service.findById.mockRejectedValue(forbiddenError);

      await expect(
        controller.findOne(boardId, mockAuthRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update board successfully', async () => {
      const boardId = 'board-mock-id';
      const updateBoardDto: UpdateBoardDto = {
        title: 'Updated Board',
      };
      const updatedBoardResponse = {
        ...mockBoardResponse,
        title: 'Updated Board',
      };

      service.update.mockResolvedValue(updatedBoardResponse);

      const result = await controller.update(
        boardId,
        updateBoardDto,
        mockAuthRequest,
      );

      expect(service.update).toHaveBeenCalledWith(
        boardId,
        updateBoardDto,
        mockAuthRequest.user.id,
      );
      expect(result).toBe(updatedBoardResponse);
    });

    it('should propagate NotFoundException when board not found', async () => {
      const boardId = 'non-existent-id';
      const updateBoardDto: UpdateBoardDto = {
        title: 'Updated Board',
      };
      const notFoundError = new NotFoundException('Board non trouvé');
      service.update.mockRejectedValue(notFoundError);

      await expect(
        controller.update(boardId, updateBoardDto, mockAuthRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException when user not owner', async () => {
      const boardId = 'board-mock-id';
      const updateBoardDto: UpdateBoardDto = {
        title: 'Updated Board',
      };
      const forbiddenError = new ForbiddenException(
        'Accès non autorisé à ce board',
      );
      service.update.mockRejectedValue(forbiddenError);

      await expect(
        controller.update(boardId, updateBoardDto, mockAuthRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove board successfully', async () => {
      const boardId = 'board-mock-id';
      service.remove.mockResolvedValue();

      await controller.remove(boardId, mockAuthRequest);

      expect(service.remove).toHaveBeenCalledWith(
        boardId,
        mockAuthRequest.user.id,
      );
    });

    it('should propagate NotFoundException when board not found', async () => {
      const boardId = 'non-existent-id';
      const notFoundError = new NotFoundException('Board non trouvé');
      service.remove.mockRejectedValue(notFoundError);

      await expect(controller.remove(boardId, mockAuthRequest)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate ForbiddenException when user not owner', async () => {
      const boardId = 'board-mock-id';
      const forbiddenError = new ForbiddenException(
        'Accès non autorisé à ce board',
      );
      service.remove.mockRejectedValue(forbiddenError);

      await expect(controller.remove(boardId, mockAuthRequest)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('GET /boards/:id/full', () => {
    it('CRITICAL - doit retourner la structure agrégée complète du board', async () => {
      // Arrange : mocks minimalistes
      const mockBoard = {
        id: 'board-1',
        title: 'Board Test',
        description: 'desc',
        backgroundColor: '#fff',
        owner: { id: 'user-1', displayName: 'Jean', isActive: true },
        status: {
          id: 'active',
          category: 'board',
          name: 'active',
          isActive: true,
        },
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
      };
      const mockMembers = [
        {
          id: 'm1',
          user: { id: 'user-1', displayName: 'Jean', email: 'j@x.com' },
          role: 'admin',
        },
      ];
      const mockSuperBlocks = [
        {
          id: 'sb1',
          title: 'SB',
          color: '#000',
          collapsed: false,
          displayOrder: 0,
          createdBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const mockBlocks = [
        {
          id: 'b1',
          blockType: 'file',
          title: 'Fichier',
          positionX: 0,
          positionY: 0,
          width: 200,
          height: 150,
          zIndex: 0,
          superBlockId: null,
          zoneType: null,
          contentId: 'f1',
          createdBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const mockFiles = [
        {
          id: 'f1',
          fileName: 'test.csv',
          mimeType: 'text/csv',
          fileSize: 123,
          fileType: 'csv',
        },
      ];

      // Mock des services
      controller['boardsService'].findById = jest
        .fn()
        .mockResolvedValue(mockBoard);
      controller['boardMembersService'].findBoardMembers = jest
        .fn()
        .mockResolvedValue(mockMembers);
      controller['superBlocksService'].findByBoard = jest
        .fn()
        .mockResolvedValue(mockSuperBlocks);
      controller['blocksService'].findByBoard = jest
        .fn()
        .mockResolvedValue(mockBlocks);
      controller['fileContentService'].findByBoardId = jest
        .fn()
        .mockResolvedValue(mockFiles);

      // Act
      const result = await controller.getFullBoard('board-1', {
        user: { id: 'user-1' },
      });

      // Assert : structure minimale
      expect(result).toHaveProperty('id', 'board-1');
      expect(result).toHaveProperty('title', 'Board Test');
      expect(result).toHaveProperty('members');
      expect(result).toHaveProperty('superBlocks');
      expect(result).toHaveProperty('blocks');
      expect(result).toHaveProperty('files');
      expect(Array.isArray(result.members)).toBe(true);
      expect(Array.isArray(result.superBlocks)).toBe(true);
      expect(Array.isArray(result.blocks)).toBe(true);
      expect(Array.isArray(result.files)).toBe(true);
      expect(typeof result.createdAt).toBe('string');
      expect(typeof result.updatedAt).toBe('string');
    });
  });
});
