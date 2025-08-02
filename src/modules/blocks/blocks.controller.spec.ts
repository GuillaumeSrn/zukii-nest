import { Test, TestingModule } from '@nestjs/testing';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { TextContentService } from '../text-content/text-content.service';
import { FileContentService } from '../file-content/file-content.service';
import { BlockRelationsService } from '../block-relations/block-relations.service';
import { AnalysisContentService } from '../analysis-content/analysis-content.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto, UpdateBlockPositionDto } from './dto/update-block.dto';
import { BlockType } from './enums/block.enum';

describe('BlocksController', () => {
  let controller: BlocksController;
  let service: jest.Mocked<BlocksService>;

  const mockBlocksService = {
    findByBoard: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updatePosition: jest.fn(),
    remove: jest.fn(),
  };

  const mockTextContentService = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockFileContentService = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockBlockRelationsService = {
    create: jest.fn(),
    findBySourceBlock: jest.fn(),
    findByTargetBlock: jest.fn(),
    remove: jest.fn(),
  };

  const mockJwtUser = { id: 'user-123' };
  const mockRequest = { user: mockJwtUser };

  const mockBlockResponse = {
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlocksController],
      providers: [
        {
          provide: BlocksService,
          useValue: mockBlocksService,
        },
        {
          provide: TextContentService,
          useValue: mockTextContentService,
        },
        {
          provide: FileContentService,
          useValue: mockFileContentService,
        },
        {
          provide: BlockRelationsService,
          useValue: mockBlockRelationsService,
        },
        {
          provide: AnalysisContentService,
          useValue: {
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BlocksController>(BlocksController);
    service = module.get<BlocksService>(
      BlocksService,
    ) as jest.Mocked<BlocksService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByBoard', () => {
    it('should return blocks for a board', async () => {
      const mockBlocks = [mockBlockResponse];
      service.findByBoard.mockResolvedValue(mockBlocks as any);

      const result = await controller.findByBoard('board-123', mockRequest);

      expect(service.findByBoard).toHaveBeenCalledWith('board-123', 'user-123');
      expect(result).toEqual(mockBlocks);
    });
  });

  describe('update', () => {
    const updateBlockDto: UpdateBlockDto = {
      title: 'Updated Block',
      positionX: 150,
    };

    it('should update a block successfully', async () => {
      const updatedBlock = { ...mockBlockResponse, ...updateBlockDto };
      service.update.mockResolvedValue(updatedBlock as any);

      const result = await controller.update(
        'block-123',
        updateBlockDto,
        mockRequest,
      );

      expect(service.update).toHaveBeenCalledWith(
        'block-123',
        updateBlockDto,
        'user-123',
      );
      expect(result).toEqual(updatedBlock);
    });
  });

  describe('updatePosition', () => {
    const positionDto: UpdateBlockPositionDto = {
      positionX: 200,
      positionY: 300,
      zIndex: 5,
    };

    it('should update block position successfully', async () => {
      const updatedBlock = { ...mockBlockResponse, ...positionDto };
      service.updatePosition.mockResolvedValue(updatedBlock as any);

      const result = await controller.updatePosition(
        'block-123',
        positionDto,
        mockRequest,
      );

      expect(service.updatePosition).toHaveBeenCalledWith(
        'block-123',
        positionDto,
        'user-123',
      );
      expect(result).toEqual(updatedBlock);
    });
  });

  describe('remove', () => {
    it('should delete a block successfully', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('board-123', 'block-123', mockRequest);

      expect(service.remove).toHaveBeenCalledWith('block-123', 'user-123');
    });
  });
});
