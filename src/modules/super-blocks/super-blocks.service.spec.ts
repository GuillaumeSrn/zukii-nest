import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SuperBlocksService } from './super-blocks.service';
import { SuperBlock } from './entities/super-block.entity';
import { Board } from '../boards/entities/board.entity';
import { User } from '../users/entities/user.entity';
import { BoardMembersService } from '../board-members/board-members.service';
import { CreateSuperBlockDto } from './dto/create-super-block.dto';
import { UpdateSuperBlockDto } from './dto/update-super-block.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BoardMemberPermission } from '../board-members/enums/board-member.enum';

describe('SuperBlocksService', () => {
  let service: SuperBlocksService;
  let superBlockRepository: jest.Mocked<Repository<SuperBlock>>;
  let boardRepository: jest.Mocked<Repository<Board>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let boardMembersService: jest.Mocked<BoardMembersService>;

  const mockSuperBlock = {
    id: 'super-block-123',
    boardId: 'board-123',
    title: 'Test Super Block',
    color: '#6366f1',
    collapsed: false,
    displayOrder: 0,
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBoard = {
    id: 'board-123',
    title: 'Test Board',
    ownerId: 'user-123',
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  beforeEach(async () => {
    const mockSuperBlockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockBoardRepository = {
      findOne: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
    };

    const mockBoardMembersService = {
      checkUserPermission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperBlocksService,
        {
          provide: getRepositoryToken(SuperBlock),
          useValue: mockSuperBlockRepository,
        },
        {
          provide: getRepositoryToken(Board),
          useValue: mockBoardRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: BoardMembersService,
          useValue: mockBoardMembersService,
        },
      ],
    }).compile();

    service = module.get<SuperBlocksService>(SuperBlocksService);
    superBlockRepository = module.get(getRepositoryToken(SuperBlock));
    boardRepository = module.get(getRepositoryToken(Board));
    userRepository = module.get(getRepositoryToken(User));
    boardMembersService = module.get(BoardMembersService);
  });

  describe('CRITICAL - Security & Permissions', () => {
    const createSuperBlockDto: CreateSuperBlockDto = {
      title: 'Test Super Block',
      color: '#6366f1',
      collapsed: false,
      displayOrder: 0,
    };

    it('CRITICAL - should require EDIT permission to create super-block', async () => {
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      boardMembersService.checkUserPermission.mockResolvedValue(false);

      await expect(
        service.create('board-123', createSuperBlockDto, 'user-123'),
      ).rejects.toThrow(ForbiddenException);

      expect(boardMembersService.checkUserPermission).toHaveBeenCalledWith(
        'board-123',
        'user-123',
        BoardMemberPermission.EDIT,
      );
    });

    it('CRITICAL - should require VIEW permission to access super-blocks', async () => {
      // Mock board existant pour passer la vérification d'existence
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      // Mock permissions insuffisantes
      boardMembersService.checkUserPermission.mockResolvedValue(false);

      await expect(
        service.findByBoard('board-123', 'user-123'),
      ).rejects.toThrow(ForbiddenException);

      expect(boardRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'board-123' },
      });
      expect(boardMembersService.checkUserPermission).toHaveBeenCalledWith(
        'board-123',
        'user-123',
        BoardMemberPermission.VIEW,
      );
    });

    it('CRITICAL - should throw NotFoundException when board does not exist', async () => {
      // Mock board inexistant
      boardRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findByBoard('nonexistent-board', 'user-123'),
      ).rejects.toThrow(NotFoundException);

      expect(boardRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'nonexistent-board' },
      });
      // Ne doit pas appeler checkUserPermission si le board n'existe pas
      expect(boardMembersService.checkUserPermission).not.toHaveBeenCalled();
    });

    it('CRITICAL - should require EDIT permission to update super-block', async () => {
      superBlockRepository.findOne.mockResolvedValue(mockSuperBlock as any);
      boardMembersService.checkUserPermission.mockResolvedValue(false);

      const updateDto: UpdateSuperBlockDto = { title: 'Updated Title' };

      await expect(
        service.update('super-block-123', updateDto, 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('CRITICAL - should require EDIT permission to delete super-block', async () => {
      superBlockRepository.findOne.mockResolvedValue(mockSuperBlock as any);
      boardMembersService.checkUserPermission.mockResolvedValue(false);

      await expect(
        service.remove('super-block-123', 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('CRITICAL - Business Logic', () => {
    const createSuperBlockDto: CreateSuperBlockDto = {
      title: 'Test Super Block',
      color: '#6366f1',
      collapsed: false,
      displayOrder: 0,
    };

    it('CRITICAL - should create super-block successfully with valid permissions', async () => {
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      userRepository.findOne.mockResolvedValue(mockUser as any);
      boardMembersService.checkUserPermission.mockResolvedValue(true);
      superBlockRepository.create.mockReturnValue(mockSuperBlock as any);
      superBlockRepository.save.mockResolvedValue(mockSuperBlock as any);

      const result = await service.create(
        'board-123',
        createSuperBlockDto,
        'user-123',
      );

      expect(result).toBeDefined();
      expect(result.title).toBe('Test Super Block');
      expect(result.boardId).toBe('board-123');
      expect(superBlockRepository.save).toHaveBeenCalled();
    });

    it('CRITICAL - should throw NotFoundException when board not found', async () => {
      boardRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('invalid-board', createSuperBlockDto, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('CRITICAL - Data Integrity', () => {
    it('CRITICAL - should apply default values correctly', async () => {
      const minimalDto: CreateSuperBlockDto = {
        title: 'Minimal Super Block',
      };

      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      userRepository.findOne.mockResolvedValue(mockUser as any);
      boardMembersService.checkUserPermission.mockResolvedValue(true);

      const expectedSuperBlock = {
        ...minimalDto,
        boardId: 'board-123',
        createdBy: 'user-123',
        color: '#6366f1',
        collapsed: false,
        displayOrder: 0,
      };

      superBlockRepository.create.mockReturnValue(expectedSuperBlock as any);
      superBlockRepository.save.mockResolvedValue(expectedSuperBlock as any);

      await service.create('board-123', minimalDto, 'user-123');

      expect(superBlockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          color: '#6366f1',
          collapsed: false,
          displayOrder: 0,
        }),
      );
    });
  });
});
