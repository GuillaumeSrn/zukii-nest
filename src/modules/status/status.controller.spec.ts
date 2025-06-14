import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StatusController } from './status.controller';
import { StatusService } from './status.service';
import { Status } from './entities/status.entity';

describe('StatusController', () => {
  let controller: StatusController;
  let service: jest.Mocked<StatusService>;

  const mockStatus = {
    id: 'user-active',
    category: 'user',
    name: 'active',
    isActive: true,
  } as Status;

  const mockStatuses = [
    {
      ...mockStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatusController],
      providers: [
        {
          provide: StatusService,
          useValue: {
            findByCategory: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StatusController>(StatusController);
    service = module.get(StatusService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStatusByCategory', () => {
    it('should return statuses for valid category', async () => {
      service.findByCategory.mockResolvedValue(mockStatuses);

      const result = await controller.getStatusByCategory('user');

      expect(result).toStrictEqual(mockStatuses);
    });

    it('should throw BadRequestException for invalid category', async () => {
      await expect(
        controller.getStatusByCategory('nonexistent'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
