import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { BoardMembersService } from './board-members.service';
import { BoardMember } from './entities/board-member.entity';
import { Board } from '../boards/entities/board.entity';
import { Status } from '../status/entities/status.entity';
import { UsersService } from '../users/users.service';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { BoardMemberPermission } from './enums/board-member.enum';

describe('BoardMembersService', () => {
  let service: BoardMembersService;
  let boardMemberRepository: jest.Mocked<Repository<BoardMember>>;
  let boardRepository: jest.Mocked<Repository<Board>>;
  let statusRepository: jest.Mocked<Repository<Status>>;
  let usersService: jest.Mocked<UsersService>;

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

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  const mockBoard = {
    id: 'board-123',
    title: 'Test Board',
    ownerId: 'owner-123',
    owner: { id: 'owner-123', displayName: 'Owner' },
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    status: { isActive: true },
  };

  const mockStatus = {
    id: 'board-member-active',
    category: 'board-member',
    name: 'active',
    isActive: true,
  };

  const mockBoardMember = {
    id: 'member-123',
    boardId: 'board-123',
    userId: 'user-123',
    permissionLevel: BoardMemberPermission.VIEW,
    statusId: 'board-member-active',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
    status: mockStatus,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardMembersService,
        {
          provide: getRepositoryToken(BoardMember),
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
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<BoardMembersService>(BoardMembersService);
    boardMemberRepository = module.get(getRepositoryToken(BoardMember));
    boardRepository = module.get(getRepositoryToken(Board));
    statusRepository = module.get(getRepositoryToken(Status));
    usersService = module.get<UsersService>(
      UsersService,
    ) as jest.Mocked<UsersService>;
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
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      boardMemberRepository.findOne.mockResolvedValue(null);
      statusRepository.findOne.mockResolvedValue(mockStatus as any);
      boardMemberRepository.create.mockReturnValue(mockBoardMember as any);
      boardMemberRepository.save.mockResolvedValue(mockBoardMember as any);

      const result = await service.create('board-123', createDto, 'owner-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('member-123');
      expect(result.permissionLevel).toBe(BoardMemberPermission.VIEW);
      expect(boardMemberRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when board not found', async () => {
      boardRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('board-123', createDto, 'owner-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner or admin', async () => {
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      boardMemberRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('board-123', createDto, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when user to add not found', async () => {
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.create('board-123', createDto, 'owner-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when user is already a member', async () => {
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      boardMemberRepository.findOne.mockResolvedValue(mockBoardMember as any);

      await expect(
        service.create('board-123', createDto, 'owner-123'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when trying to add owner as member', async () => {
      const ownerUser = { ...mockUser, id: 'owner-123' };
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      usersService.findByEmail.mockResolvedValue(ownerUser as any);
      boardMemberRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('board-123', createDto, 'owner-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // describe('findBoardMembers', () => {
  //   it('should return board members for owner', async () => {
  //     boardRepository.findOne.mockResolvedValue(mockBoard as any);
  //     boardMemberRepository.find.mockResolvedValue([mockBoardMember] as any);

  //     const result = await service.findBoardMembers('board-123', 'owner-123');

  //     expect(result).toHaveLength(1);
  //     expect(result[0].id).toBe('member-123');
  //   });

  //   it('should return board members for valid member', async () => {
  //     boardRepository.findOne.mockResolvedValue(mockBoard as any);
  //     boardMemberRepository.findOne.mockResolvedValue(mockBoardMember as any);
  //     boardMemberRepository.find.mockResolvedValue([mockBoardMember] as any);

  //     const result = await service.findBoardMembers('board-123', 'user-123');

  //     expect(result).toHaveLength(1);
  //     expect(result[0].id).toBe('member-123');
  //   });

  //   it('should throw ForbiddenException for non-member', async () => {
  //     boardRepository.findOne.mockResolvedValue(mockBoard as any);
  //     boardMemberRepository.findOne.mockResolvedValue(null);

  //     await expect(
  //       service.findBoardMembers('board-123', 'other-user'),
  //     ).rejects.toThrow(ForbiddenException);
  //   });
  // });

  describe('updateUserPermission', () => {
    it('devrait mettre à jour les permissions par userId', async () => {
      const boardId = 'board-1';
      const userId = 'user-2';
      const updateDto = { permissionLevel: BoardMemberPermission.ADMIN };

      const mockBoard = { id: boardId, ownerId: 'user-1' } as Board;
      boardRepository.findOne.mockResolvedValueOnce(mockBoard);

      const mockMember = {
        id: 'member-1',
        userId,
        boardId,
        permissionLevel: BoardMemberPermission.VIEW,
        user: mockUser,
        status: mockStatus,
      } as BoardMember;
      boardMemberRepository.findOne.mockResolvedValueOnce(mockMember);
      boardMemberRepository.save.mockResolvedValueOnce({
        ...mockMember,
        ...updateDto,
        updatedBy: 'user-1',
      });

      const result = await service.updateUserPermission(
        boardId,
        userId,
        updateDto,
        'user-1',
      );

      expect(boardMemberRepository.findOne).toHaveBeenCalledWith({
        where: { userId, boardId },
        relations: ['user', 'status'],
      });
      expect(result.permissionLevel).toBe(BoardMemberPermission.ADMIN);
    });
  });

  describe('removeByUserId', () => {
    it('should remove user from board successfully', async () => {
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      boardMemberRepository.findOne.mockResolvedValue(mockBoardMember as any);
      boardMemberRepository.delete.mockResolvedValue({
        affected: 1,
        raw: {},
      } as any);

      await service.removeByUserId('board-123', 'user-123', 'owner-123');

      expect(boardMemberRepository.findOne).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          boardId: 'board-123',
        },
        relations: ['user', 'status'],
      });
      expect(boardMemberRepository.delete).toHaveBeenCalledWith('member-123');
    });

    it('should throw NotFoundException when user not member', async () => {
      boardRepository.findOne.mockResolvedValue(mockBoard as any);
      boardMemberRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeByUserId('board-123', 'user-456', 'owner-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
