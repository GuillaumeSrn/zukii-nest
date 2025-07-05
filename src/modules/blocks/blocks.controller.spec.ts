import { Test, TestingModule } from '@nestjs/testing';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto, UpdateBlockPositionDto } from './dto/update-block.dto';
import { BlockType } from './enums/block.enum';

describe('BlocksController', () => {
  let controller: BlocksController;
  let service: jest.Mocked<BlocksService>;

  const mockBlocksService = {
    create: jest.fn(),
    findByBoard: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updatePosition: jest.fn(),
    remove: jest.fn(),
  };

  const mockJwtUser = { id: 'user-123' };
  const mockRequest = { user: mockJwtUser };

  const mockBlockResponse = {
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
    status: {
      id: 'block-active',
      category: 'block',
      name: 'active',
      isActive: true,
    },
    lastModifiedBy: 'user-123',
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

    it('should create a block successfully', async () => {
      service.create.mockResolvedValue(mockBlockResponse as any);

      const result = await controller.create(
        'board-123',
        createBlockDto,
        mockRequest,
      );

      expect(service.create).toHaveBeenCalledWith(
        'board-123',
        createBlockDto,
        'user-123',
      );
      expect(result).toEqual(mockBlockResponse);
    });
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

  describe('findOne', () => {
    it('should return a specific block', async () => {
      service.findOne.mockResolvedValue(mockBlockResponse as any);

      const result = await controller.findOne('block-123', mockRequest);

      expect(service.findOne).toHaveBeenCalledWith('block-123', 'user-123');
      expect(result).toEqual(mockBlockResponse);
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

      await controller.remove('block-123', mockRequest);

      expect(service.remove).toHaveBeenCalledWith('block-123', 'user-123');
    });
  });
});
