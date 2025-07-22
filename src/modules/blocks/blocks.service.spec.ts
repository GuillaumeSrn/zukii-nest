import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { Block } from './entities/block.entity';
import { Board } from '../boards/entities/board.entity';
import { Status } from '../status/entities/status.entity';
import { User } from '../users/entities/user.entity';
import { BoardMembersService } from '../board-members/board-members.service';
import { TextContentService } from '../text-content/text-content.service';
import { FileContentService } from '../file-content/file-content.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto, UpdateBlockPositionDto } from './dto/update-block.dto';
import { BlockType } from './enums/block.enum';
import { BoardMemberPermission } from '../board-members/enums/board-member.enum';

describe('BlocksService', () => {
  let service: BlocksService;
  let blockRepository: jest.Mocked<Repository<Block>>;
  let boardRepository: jest.Mocked<Repository<Board>>;
  let statusRepository: jest.Mocked<Repository<Status>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let mockBoardMembersService: jest.Mocked<BoardMembersService>;
  let textContentService: jest.Mocked<TextContentService>;
  let fileContentService: jest.Mocked<FileContentService>;

  const mockBoard = {
    id: 'board-123',
    title: 'Test Board',
    ownerId: 'owner-123',
  };

  const mockStatus = {
    id: 'block-active',
    category: 'block',
    name: 'active',
    isActive: true,
  };

  const mockUser = {
    id: 'user-123',
    displayName: 'Test User',
    email: 'test@example.com',
  };

  // Mock de l'entité Block (structure base de données)
  const mockBlockEntity = {
    id: 'block-123',
    boardId: 'board-123',
    createdBy: 'user-123',
    blockType: BlockType.TEXT,
    title: 'Test Block',
    positionX: 100,
    positionY: 200,
    width: 300,
    height: 400,
    zIndex: 1,
    contentId: 'content-123',
    statusId: 'block-active',
    lastModifiedBy: 'user-123',
    superBlockId: undefined,
    zoneType: undefined,
    status: mockStatus,
    lastModifier: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock de la réponse DTO (ce que le service retourne)
  const mockBlockResponseDto = {
    id: 'block-123',
    boardId: 'board-123',
    blockType: BlockType.TEXT,
    title: 'Test Block',
    positionX: 100,
    positionY: 200,
    width: 300,
    height: 400,
    zIndex: 1,
    contentId: 'content-123',
    superBlockId: undefined,
    zoneType: undefined,
    status: {
      id: 'block-active',
      category: 'block',
      name: 'active',
      isActive: true,
    },
    lastModifiedByUser: {
      id: 'user-123',
      displayName: 'Test User',
      isActive: true,
    },
    createdAt: mockBlockEntity.createdAt,
    updatedAt: mockBlockEntity.updatedAt,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlocksService,
        {
          provide: getRepositoryToken(Block),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Board),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Status),
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
          provide: BoardMembersService,
          useValue: {
            checkUserPermission: jest.fn(),
          },
        },
        {
          provide: TextContentService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: FileContentService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BlocksService>(BlocksService);
    blockRepository = module.get(getRepositoryToken(Block));
    boardRepository = module.get(getRepositoryToken(Board));
    statusRepository = module.get(getRepositoryToken(Status));
    userRepository = module.get(getRepositoryToken(User));
    mockBoardMembersService = module.get(BoardMembersService);
    textContentService = module.get(TextContentService);
    fileContentService = module.get(FileContentService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createBlockDto: CreateBlockDto = {
      blockType: BlockType.TEXT,
      title: 'Test Block',
      positionX: 100,
      positionY: 200,
      width: 300,
      height: 400,
      contentId: 'content-123',
    };

    it('should create a block successfully when user has edit permission', async () => {
      textContentService.findOne.mockResolvedValue({
        id: 'content-123',
      } as any);
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      statusRepository.findOne.mockResolvedValue(mockStatus as any);
      blockRepository.create.mockReturnValue(mockBlockEntity as any);
      blockRepository.save.mockResolvedValue(mockBlockEntity as any);
      blockRepository.findOne.mockResolvedValue(mockBlockEntity as any);

      const result = await service.create(
        'board-123',
        createBlockDto,
        'user-123',
      );

      expect(textContentService.findOne).toHaveBeenCalledWith('content-123');
      expect(boardRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'board-123' },
      });
      expect(mockBoardMembersService.checkUserPermission).toHaveBeenCalledWith(
        'board-123',
        'user-123',
        BoardMemberPermission.EDIT,
      );
      expect(statusRepository.findOne).toHaveBeenCalledWith({
        where: { category: 'block', name: 'active', isActive: true },
      });
      expect(blockRepository.create).toHaveBeenCalledWith({
        ...createBlockDto,
        boardId: 'board-123',
        createdBy: 'user-123',
        statusId: 'block-active',
        lastModifiedBy: 'user-123',
        width: 300,
        height: 400,
        zIndex: 0,
      });
      expect(result).toEqual(mockBlockResponseDto);
    });

    it('should throw NotFoundException when board does not exist', async () => {
      textContentService.findOne.mockResolvedValue({
        id: 'content-123',
      } as any);
      boardRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('board-123', createBlockDto, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user lacks edit permission', async () => {
      textContentService.findOne.mockResolvedValue({
        id: 'content-123',
      } as any);
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(false);

      await expect(
        service.create('board-123', createBlockDto, 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when active status not found', async () => {
      textContentService.findOne.mockResolvedValue({
        id: 'content-123',
      } as any);
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      statusRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('board-123', createBlockDto, 'user-123'),
      ).rejects.toThrow(ConflictException);
    });

    it('should validate position constraints', async () => {
      const invalidPositionDto = {
        ...createBlockDto,
        positionX: -1,
        positionY: -1,
      };

      await expect(
        service.create('board-123', invalidPositionDto, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate dimension constraints', async () => {
      const invalidDimensionsDto = {
        ...createBlockDto,
        width: 0,
        height: -10,
      };

      await expect(
        service.create('board-123', invalidDimensionsDto, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('CRITICAL - Block Content Validation', () => {
    const createTextBlockDto: CreateBlockDto = {
      blockType: BlockType.TEXT,
      title: 'Test Text Block',
      positionX: 100,
      positionY: 200,
      width: 300,
      height: 400,
      contentId: 'text-content-123',
    };

    const createFileBlockDto: CreateBlockDto = {
      blockType: BlockType.FILE,
      title: 'Test File Block',
      positionX: 100,
      positionY: 200,
      width: 300,
      height: 400,
      contentId: 'file-content-123',
    };

    it('CRITICAL - should validate TEXT content exists before creating block', async () => {
      textContentService.findOne.mockResolvedValue({
        id: 'text-content-123',
      } as any);
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      statusRepository.findOne.mockResolvedValue(mockStatus as any);
      blockRepository.create.mockReturnValue(mockBlockEntity as any);
      blockRepository.save.mockResolvedValue(mockBlockEntity as any);
      blockRepository.findOne.mockResolvedValue(mockBlockEntity as any);

      await service.create('board-123', createTextBlockDto, 'user-123');

      expect(textContentService.findOne).toHaveBeenCalledWith(
        'text-content-123',
      );
      expect(fileContentService.findOne).not.toHaveBeenCalled();
    });

    it('CRITICAL - should validate FILE content exists before creating block', async () => {
      fileContentService.findOne.mockResolvedValue({
        id: 'file-content-123',
      } as any);
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      statusRepository.findOne.mockResolvedValue(mockStatus as any);
      blockRepository.create.mockReturnValue(mockBlockEntity as any);
      blockRepository.save.mockResolvedValue(mockBlockEntity as any);
      blockRepository.findOne.mockResolvedValue(mockBlockEntity as any);

      await service.create('board-123', createFileBlockDto, 'user-123');

      expect(fileContentService.findOne).toHaveBeenCalledWith(
        'file-content-123',
      );
      expect(textContentService.findOne).not.toHaveBeenCalled();
    });

    it('CRITICAL - should reject blocks with invalid TEXT content references', async () => {
      textContentService.findOne.mockRejectedValue(
        new NotFoundException('Contenu textuel non trouvé'),
      );

      await expect(
        service.create('board-123', createTextBlockDto, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('CRITICAL - should reject blocks with invalid FILE content references', async () => {
      fileContentService.findOne.mockRejectedValue(
        new NotFoundException('Fichier non trouvé'),
      );

      await expect(
        service.create('board-123', createFileBlockDto, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('CRITICAL - should reject ANALYSIS blocks as not yet supported', async () => {
      const createAnalysisBlockDto: CreateBlockDto = {
        blockType: BlockType.ANALYSIS,
        title: 'Test Analysis Block',
        positionX: 100,
        positionY: 200,
        width: 300,
        height: 400,
        contentId: 'analysis-content-123',
      };

      await expect(
        service.create('board-123', createAnalysisBlockDto, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('CRITICAL - should reject blocks with invalid block type', async () => {
      const createInvalidBlockDto = {
        blockType: 'INVALID_TYPE' as BlockType,
        title: 'Test Invalid Block',
        positionX: 100,
        positionY: 200,
        width: 300,
        height: 400,
        contentId: 'content-123',
      };

      await expect(
        service.create('board-123', createInvalidBlockDto, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByBoard', () => {
    it('should return blocks when user has view permission', async () => {
      const mockBlocks = [mockBlockEntity];
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      blockRepository.find.mockResolvedValue(mockBlocks as any);

      const result = await service.findByBoard('board-123', 'user-123');

      expect(mockBoardMembersService.checkUserPermission).toHaveBeenCalledWith(
        'board-123',
        'user-123',
        BoardMemberPermission.VIEW,
      );
      expect(blockRepository.find).toHaveBeenCalledWith({
        where: { boardId: 'board-123', status: { isActive: true } },
        relations: ['status', 'lastModifier'],
        order: { zIndex: 'ASC', createdAt: 'ASC' },
      });
      expect(result).toEqual([mockBlockResponseDto]);
    });

    it('should throw ForbiddenException when user lacks view permission', async () => {
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(false);

      await expect(
        service.findByBoard('board-123', 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return block when user has view permission', async () => {
      blockRepository.findOne.mockResolvedValue(mockBlockEntity as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);

      const result = await service.findOne('block-123', 'user-123');

      expect(blockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'block-123' },
        relations: ['status', 'lastModifier'],
      });
      expect(mockBoardMembersService.checkUserPermission).toHaveBeenCalledWith(
        'board-123',
        'user-123',
        BoardMemberPermission.VIEW,
      );
      expect(result).toEqual(mockBlockResponseDto);
    });

    it('should throw NotFoundException when block does not exist', async () => {
      blockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('block-123', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateBlockDto: UpdateBlockDto = {
      title: 'Updated Block',
      positionX: 150,
      positionY: 250,
    };

    it('should update block when user has edit permission', async () => {
      blockRepository.findOne.mockResolvedValue(mockBlockEntity as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      const updatedBlock = { ...mockBlockEntity, ...updateBlockDto };
      blockRepository.save.mockResolvedValue(updatedBlock as any);

      // Créer le DTO de réponse attendu avec les nouvelles valeurs
      const expectedResponseDto = {
        ...mockBlockResponseDto,
        title: 'Updated Block',
        positionX: 150,
        positionY: 250,
      };

      const result = await service.update(
        'block-123',
        updateBlockDto,
        'user-123',
      );

      expect(blockRepository.save).toHaveBeenCalledWith({
        ...mockBlockEntity,
        ...updateBlockDto,
        lastModifiedBy: 'user-123',
      });
      expect(result).toEqual(expectedResponseDto);
    });

    it('should throw ForbiddenException when user lacks edit permission', async () => {
      blockRepository.findOne.mockResolvedValue(mockBlockEntity as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(false);

      await expect(
        service.update('block-123', updateBlockDto, 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove block when user has edit permission', async () => {
      blockRepository.findOne.mockResolvedValue(mockBlockEntity as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      blockRepository.delete.mockResolvedValue({ affected: 1, raw: {} } as any);

      await service.remove('block-123', 'user-123');

      expect(blockRepository.delete).toHaveBeenCalledWith('block-123');
    });

    it('should throw ForbiddenException when user lacks edit permission', async () => {
      blockRepository.findOne.mockResolvedValue(mockBlockEntity as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(false);

      await expect(service.remove('block-123', 'user-123')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when block deletion fails', async () => {
      blockRepository.findOne.mockResolvedValue(mockBlockEntity as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      blockRepository.delete.mockResolvedValue({ affected: 0, raw: {} } as any);

      await expect(service.remove('block-123', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should automatically cleanup empty super-blocks after block removal', async () => {
      const blockWithSuperBlock = {
        ...mockBlockEntity,
        superBlockId: 'super-block-456',
      };

      blockRepository.findOne.mockResolvedValue(blockWithSuperBlock as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      blockRepository.delete.mockResolvedValue({ affected: 1, raw: {} } as any);

      // Mock que le super-block est devenu vide (0 blocks restants)
      blockRepository.count.mockResolvedValue(0);

      // Mock pour la suppression du super-block
      const mockManagerQuery = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(blockRepository, 'manager', {
        value: { query: mockManagerQuery },
        writable: true,
      });

      await service.remove('block-123', 'user-123');

      // Vérifier que le nettoyage a été déclenché
      expect(blockRepository.count).toHaveBeenCalledWith({
        where: {
          superBlockId: 'super-block-456',
          status: { isActive: true },
        },
      });

      // Vérifier que le super-block vide a été supprimé
      expect(mockManagerQuery).toHaveBeenCalledWith(
        'DELETE FROM super_blocks WHERE id = $1',
        ['super-block-456'],
      );
    });

    it('should detach remaining block and cleanup super-block when only one block remains', async () => {
      const blockWithSuperBlock = {
        ...mockBlockEntity,
        superBlockId: 'super-block-456',
      };

      blockRepository.findOne.mockResolvedValue(blockWithSuperBlock as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      blockRepository.delete.mockResolvedValue({ affected: 1, raw: {} } as any);

      // Mock qu'il reste 1 block dans le super-block
      blockRepository.count.mockResolvedValue(1);
      blockRepository.update.mockResolvedValue({ affected: 1 } as any);

      // Mock pour la suppression du super-block
      const mockManagerQuery = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(blockRepository, 'manager', {
        value: { query: mockManagerQuery },
        writable: true,
      });

      await service.remove('block-123', 'user-123');

      // Vérifier que le block restant a été détaché
      expect(blockRepository.update).toHaveBeenCalledWith(
        { superBlockId: 'super-block-456' },
        { superBlockId: undefined },
      );

      // Vérifier que le super-block avec un seul block a été supprimé
      expect(mockManagerQuery).toHaveBeenCalledWith(
        'DELETE FROM super_blocks WHERE id = $1',
        ['super-block-456'],
      );
    });

    it('should not cleanup super-block when multiple blocks remain', async () => {
      const blockWithSuperBlock = {
        ...mockBlockEntity,
        superBlockId: 'super-block-456',
      };

      blockRepository.findOne.mockResolvedValue(blockWithSuperBlock as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      blockRepository.delete.mockResolvedValue({ affected: 1, raw: {} } as any);

      // Mock qu'il reste 2+ blocks dans le super-block
      blockRepository.count.mockResolvedValue(2);

      // Mock pour la suppression du super-block
      const mockManagerQuery = jest.fn();
      Object.defineProperty(blockRepository, 'manager', {
        value: { query: mockManagerQuery },
        writable: true,
      });

      await service.remove('block-123', 'user-123');

      // Vérifier que le super-block n'a PAS été supprimé
      expect(mockManagerQuery).not.toHaveBeenCalled();
      expect(blockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('updatePosition', () => {
    const positionDto = {
      positionX: 200,
      positionY: 300,
      zIndex: 5,
    };

    it('should update block position when user has edit permission', async () => {
      // Créer un mock fresh pour éviter la pollution du test update
      const freshMockBlockEntity = {
        ...mockBlockEntity,
        title: 'Test Block', // Assurer le titre original
      };

      blockRepository.findOne.mockResolvedValue(freshMockBlockEntity as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      const updatedBlock = { ...freshMockBlockEntity, ...positionDto };
      blockRepository.save.mockResolvedValue(updatedBlock as any);

      // Créer le DTO de réponse attendu avec les nouvelles positions
      const expectedResponseDto = {
        ...mockBlockResponseDto,
        positionX: 200,
        positionY: 300,
        zIndex: 5,
        title: 'Test Block', // Garder le titre original
      };

      const result = await service.updatePosition(
        'block-123',
        positionDto,
        'user-123',
      );

      expect(blockRepository.save).toHaveBeenCalledWith({
        ...freshMockBlockEntity,
        ...positionDto,
        lastModifiedBy: 'user-123',
      });
      expect(result).toEqual(expectedResponseDto);
    });

    it('should validate position constraints on update', async () => {
      const invalidPositionDto = {
        positionX: -10,
        positionY: 50,
      };

      await expect(
        service.updatePosition('block-123', invalidPositionDto, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
