import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockRelationsService } from './block-relations.service';
import { BlockRelation } from './entities/block-relation.entity';
import { Block } from '../blocks/entities/block.entity';
import { User } from '../users/entities/user.entity';
import { BoardMembersService } from '../board-members/board-members.service';
import { CreateBlockRelationDto } from './dto/create-block-relation.dto';
import { BlockRelationType } from './enums/block-relation.enum';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BoardMemberPermission } from '../board-members/enums/board-member.enum';

describe('BlockRelationsService', () => {
  let service: BlockRelationsService;
  let blockRelationRepository: jest.Mocked<Repository<BlockRelation>>;
  let blockRepository: jest.Mocked<Repository<Block>>;
  let boardMembersService: jest.Mocked<BoardMembersService>;

  const mockBlock = {
    id: 'block-123',
    boardId: 'board-123',
    blockType: 'text',
    createdBy: 'user-123',
  };

  const mockRelation = {
    id: 'relation-123',
    sourceBlockId: 'block-123',
    targetBlockId: 'block-456',
    relationType: BlockRelationType.GENERATED_FROM,
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockBlockRelationRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const mockBlockRepository = {
      findOne: jest.fn(),
    };

    const mockBoardMembersService = {
      checkUserPermission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockRelationsService,
        {
          provide: getRepositoryToken(BlockRelation),
          useValue: mockBlockRelationRepository,
        },
        {
          provide: getRepositoryToken(Block),
          useValue: mockBlockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: BoardMembersService,
          useValue: mockBoardMembersService,
        },
      ],
    }).compile();

    service = module.get<BlockRelationsService>(BlockRelationsService);
    blockRelationRepository = module.get(getRepositoryToken(BlockRelation));
    blockRepository = module.get(getRepositoryToken(Block));
    boardMembersService = module.get(BoardMembersService);
  });

  describe('CRITICAL - Security & Permissions', () => {
    const createDto: CreateBlockRelationDto = {
      sourceBlockId: 'block-123',
      targetBlockId: 'block-456',
      relationType: BlockRelationType.GENERATED_FROM,
    };

    it('CRITICAL - should require EDIT permission on both blocks to create relation', async () => {
      blockRepository.findOne
        .mockResolvedValueOnce(mockBlock as any)
        .mockResolvedValueOnce({ ...mockBlock, id: 'block-456' } as any);
      boardMembersService.checkUserPermission
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      await expect(service.create(createDto, 'user-123')).rejects.toThrow(
        ForbiddenException,
      );

      expect(boardMembersService.checkUserPermission).toHaveBeenCalledTimes(2);
    });

    it('CRITICAL - should require VIEW permission to access relations', async () => {
      blockRepository.findOne.mockResolvedValue(mockBlock as any);
      boardMembersService.checkUserPermission.mockResolvedValue(false);

      await expect(
        service.findBySourceBlock('block-123', 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('CRITICAL - Business Logic', () => {
    const createDto: CreateBlockRelationDto = {
      sourceBlockId: 'block-123',
      targetBlockId: 'block-456',
      relationType: BlockRelationType.GENERATED_FROM,
    };

    it('CRITICAL - should prevent self-relation', async () => {
      const selfRelationDto: CreateBlockRelationDto = {
        sourceBlockId: 'block-123',
        targetBlockId: 'block-123',
        relationType: BlockRelationType.REFERENCES,
      };

      blockRepository.findOne.mockResolvedValue(mockBlock as any);
      boardMembersService.checkUserPermission.mockResolvedValue(true);

      await expect(service.create(selfRelationDto, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('CRITICAL - should prevent duplicate relations', async () => {
      blockRepository.findOne
        .mockResolvedValueOnce(mockBlock as any)
        .mockResolvedValueOnce({ ...mockBlock, id: 'block-456' } as any);
      boardMembersService.checkUserPermission.mockResolvedValue(true);
      blockRelationRepository.findOne.mockResolvedValue(mockRelation as any);

      await expect(service.create(createDto, 'user-123')).rejects.toThrow(
        ConflictException,
      );
    });

    it('CRITICAL - should create relation successfully with valid data', async () => {
      blockRepository.findOne
        .mockResolvedValueOnce(mockBlock as any)
        .mockResolvedValueOnce({ ...mockBlock, id: 'block-456' } as any);
      boardMembersService.checkUserPermission.mockResolvedValue(true);
      blockRelationRepository.findOne.mockResolvedValue(null);
      blockRelationRepository.create.mockReturnValue(mockRelation as any);
      blockRelationRepository.save.mockResolvedValue(mockRelation as any);

      const result = await service.create(createDto, 'user-123');

      expect(result).toBeDefined();
      expect(result.sourceBlockId).toBe('block-123');
      expect(result.targetBlockId).toBe('block-456');
      expect(blockRelationRepository.save).toHaveBeenCalled();
    });

    it('CRITICAL - should throw NotFoundException when block not found', async () => {
      blockRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
