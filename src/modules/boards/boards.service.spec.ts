import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { Board } from './entities/board.entity';
import { User } from '../users/entities/user.entity';
import { Status } from '../status/entities/status.entity';
import { UsersService } from '../users/users.service';

describe('BoardsService', () => {
  let service: BoardsService;
  let boardRepository: jest.Mocked<Repository<Board>>;
  let statusRepository: jest.Mocked<Repository<Status>>;
  let usersService: jest.Mocked<UsersService>;

  const mockStatus = {
    id: 'board-active',
    category: 'board',
    name: 'active',
    isActive: true,
  } as Status;

  const mockUser = {
    id: 'user-test-id',
    email: 'test@example.com',
    displayName: 'Test User',
    status: { isActive: true },
  } as User;

  const mockBoard = {
    id: 'board-test-id',
    title: 'Test Board',
    description: 'Test Description',
    backgroundColor: '#FFFFFF',
    ownerId: 'user-test-id',
    statusId: 'board-active',
    owner: mockUser,
    status: mockStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as Board;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        {
          provide: getRepositoryToken(Board),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Status),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByIdEntity: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BoardsService>(BoardsService);
    boardRepository = module.get(getRepositoryToken(Board));
    statusRepository = module.get(getRepositoryToken(Status));
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createBoardDto = {
      title: 'Test Board',
      description: 'Test Description',
      backgroundColor: '#FFFFFF',
    };

    it('should create a board successfully', async () => {
      usersService.findByIdEntity.mockResolvedValue(mockUser);
      statusRepository.findOne.mockResolvedValue(mockStatus);
      boardRepository.create.mockReturnValue(mockBoard);
      boardRepository.save.mockResolvedValue(mockBoard);

      const result = await service.create(createBoardDto, mockUser.id);

      expect(usersService.findByIdEntity).toHaveBeenCalledWith(mockUser.id);
      expect(statusRepository.findOne).toHaveBeenCalledWith({
        where: { category: 'board', name: 'active', isActive: true },
      });
      expect(boardRepository.create).toHaveBeenCalledWith({
        ...createBoardDto,
        ownerId: mockUser.id,
        statusId: mockStatus.id,
      });
      expect(result).toBeDefined();
      expect(result.title).toBe(createBoardDto.title);
    });

    it('should throw NotFoundException when user not found', async () => {
      usersService.findByIdEntity.mockResolvedValue(null);

      await expect(
        service.create(createBoardDto, 'nonexistent-user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when default status not found', async () => {
      usersService.findByIdEntity.mockResolvedValue(mockUser);
      statusRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createBoardDto, mockUser.id)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findMyBoards', () => {
    it('should return user boards successfully', async () => {
      const mockBoards = [mockBoard];
      boardRepository.find.mockResolvedValue(mockBoards);

      const result = await service.findMyBoards(mockUser.id);

      expect(boardRepository.find).toHaveBeenCalledWith({
        where: {
          ownerId: mockUser.id,
          deletedAt: expect.anything(),
        },
        relations: ['owner', 'status'],
        order: { updatedAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe(mockBoard.title);
    });

    it('should return empty array when user has no boards', async () => {
      boardRepository.find.mockResolvedValue([]);

      const result = await service.findMyBoards(mockUser.id);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return board successfully when user is owner', async () => {
      boardRepository.findOne.mockResolvedValue(mockBoard);

      const result = await service.findById(mockBoard.id, mockUser.id);

      expect(boardRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockBoard.id, deletedAt: expect.anything() },
        relations: ['owner', 'status'],
      });
      expect(result.id).toBe(mockBoard.id);
    });

    it('should throw NotFoundException when board not found', async () => {
      boardRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findById('nonexistent-id', mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const otherUserBoard = {
        ...mockBoard,
        ownerId: 'other-user-id',
      } as Board;
      boardRepository.findOne.mockResolvedValue(otherUserBoard);

      await expect(service.findById(mockBoard.id, mockUser.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    const updateBoardDto = {
      title: 'Updated Board',
    };

    it('should update board successfully when user is owner', async () => {
      const updatedBoard = { ...mockBoard, title: 'Updated Board' };
      boardRepository.findOne.mockResolvedValue(mockBoard);
      boardRepository.save.mockResolvedValue(updatedBoard);

      const result = await service.update(
        mockBoard.id,
        updateBoardDto,
        mockUser.id,
      );

      expect(result.title).toBe('Updated Board');
    });

    it('should throw NotFoundException when board not found', async () => {
      boardRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', updateBoardDto, mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const otherUserBoard = {
        ...mockBoard,
        ownerId: 'other-user-id',
      } as Board;
      boardRepository.findOne.mockResolvedValue(otherUserBoard);

      await expect(
        service.update(mockBoard.id, updateBoardDto, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove board successfully when user is owner', async () => {
      boardRepository.findOne.mockResolvedValue(mockBoard);
      boardRepository.softDelete.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

      await service.remove(mockBoard.id, mockUser.id);

      expect(boardRepository.softDelete).toHaveBeenCalledWith(mockBoard.id);
    });

    it('should throw NotFoundException when board not found', async () => {
      boardRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent-id', mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const otherUserBoard = {
        ...mockBoard,
        ownerId: 'other-user-id',
      } as Board;
      boardRepository.findOne.mockResolvedValue(otherUserBoard);

      await expect(service.remove(mockBoard.id, mockUser.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
