import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { Block } from './entities/block.entity';
import { Board } from '../boards/entities/board.entity';
import { Status } from '../status/entities/status.entity';
import { BoardMembersService } from '../board-members/board-members.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { BlockType } from './enums/block.enum';
import { BoardMemberPermission } from '../board-members/enums/board-member.enum';

describe('BlocksService', () => {
  let service: BlocksService;
  let blockRepository: jest.Mocked<Repository<Block>>;
  let boardRepository: jest.Mocked<Repository<Board>>;
  let statusRepository: jest.Mocked<Repository<Status>>;
  let boardMembersService: jest.Mocked<BoardMembersService>;

  const mockStatus = {
    id: 'block-active',
    category: 'block',
    name: 'active',
    isActive: true,
  };

  const mockBoard = {
    id: 'board-123',
    title: 'Test Board',
    ownerId: 'owner-123',
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockBlock = {
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBoardMemberRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  const mockBoardRepository = {
    findOne: jest.fn(),
  };

  const mockStatusRepository = {
    findOne: jest.fn(),
  };

  const mockBoardMembersService = {
    checkUserPermission: jest.fn(),
    findByBoardAndUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlocksService,
        {
          provide: getRepositoryToken(Block),
          useValue: mockBoardMemberRepository,
        },
        {
          provide: getRepositoryToken(Board),
          useValue: mockBoardRepository,
        },
        {
          provide: getRepositoryToken(Status),
          useValue: mockStatusRepository,
        },
        {
          provide: BoardMembersService,
          useValue: mockBoardMembersService,
        },
      ],
    }).compile();

    service = module.get<BlocksService>(BlocksService);
    blockRepository = module.get(getRepositoryToken(Block));
    boardRepository = module.get(getRepositoryToken(Board));
    statusRepository = module.get(getRepositoryToken(Status));
    boardMembersService = module.get(BoardMembersService);
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
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      statusRepository.findOne.mockResolvedValue(mockStatus as any);
      blockRepository.create.mockReturnValue(mockBlock as any);
      blockRepository.save.mockResolvedValue(mockBlock as any);
      blockRepository.findOne.mockResolvedValue(mockBlock as any);

      const result = await service.create(
        'board-123',
        createBlockDto,
        'user-123',
      );

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
      expect(result).toEqual(mockBlock);
    });

    it('should throw NotFoundException when board does not exist', async () => {
      boardRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('board-123', createBlockDto, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user lacks edit permission', async () => {
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(false);

      await expect(
        service.create('board-123', createBlockDto, 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when active status not found', async () => {
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

  describe('findByBoard', () => {
    it('should return blocks when user has view permission', async () => {
      const mockBlocks = [mockBlock];
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
        relations: ['status'],
        order: { zIndex: 'ASC', createdAt: 'ASC' },
      });
      expect(result).toEqual(mockBlocks);
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
      blockRepository.findOne.mockResolvedValue(mockBlock as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);

      const result = await service.findOne('block-123', 'user-123');

      expect(blockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'block-123' },
        relations: ['status'],
      });
      expect(mockBoardMembersService.checkUserPermission).toHaveBeenCalledWith(
        'board-123',
        'user-123',
        BoardMemberPermission.VIEW,
      );
      expect(result).toEqual(mockBlock);
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
      blockRepository.findOne.mockResolvedValue(mockBlock as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      const updatedBlock = { ...mockBlock, ...updateBlockDto };
      blockRepository.save.mockResolvedValue(updatedBlock as any);

      const result = await service.update(
        'block-123',
        updateBlockDto,
        'user-123',
      );

      expect(blockRepository.save).toHaveBeenCalledWith({
        ...mockBlock,
        ...updateBlockDto,
        lastModifiedBy: 'user-123',
        updatedAt: expect.any(Date),
      });
      expect(result).toEqual(updatedBlock);
    });

    it('should throw ForbiddenException when user lacks edit permission', async () => {
      blockRepository.findOne.mockResolvedValue(mockBlock as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(false);

      await expect(
        service.update('block-123', updateBlockDto, 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove block when user has edit permission', async () => {
      blockRepository.findOne.mockResolvedValue(mockBlock as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      blockRepository.delete.mockResolvedValue({ affected: 1, raw: {} } as any);

      await service.remove('block-123', 'user-123');

      expect(blockRepository.delete).toHaveBeenCalledWith('block-123');
    });

    it('should throw ForbiddenException when user lacks edit permission', async () => {
      blockRepository.findOne.mockResolvedValue(mockBlock as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(false);

      await expect(service.remove('block-123', 'user-123')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when block deletion fails', async () => {
      blockRepository.findOne.mockResolvedValue(mockBlock as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      blockRepository.delete.mockResolvedValue({ affected: 0, raw: {} } as any);

      await expect(service.remove('block-123', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePosition', () => {
    const positionDto = {
      positionX: 200,
      positionY: 300,
      zIndex: 5,
    };

    it('should update block position when user has edit permission', async () => {
      blockRepository.findOne.mockResolvedValue(mockBlock as any);
      mockBoardMembersService.checkUserPermission.mockResolvedValue(true);
      const updatedBlock = { ...mockBlock, ...positionDto };
      blockRepository.save.mockResolvedValue(updatedBlock as any);

      const result = await service.updatePosition(
        'block-123',
        positionDto,
        'user-123',
      );

      expect(blockRepository.save).toHaveBeenCalledWith({
        ...mockBlock,
        ...positionDto,
        lastModifiedBy: 'user-123',
        updatedAt: expect.any(Date),
      });
      expect(result).toEqual(updatedBlock);
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
