import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StatusController } from './status.controller';
import { StatusService } from './status.service';

describe('StatusController', () => {
  let controller: StatusController;
  let service: jest.Mocked<StatusService>;

  const mockStatus = {
    id: 'user-active',
    category: 'user',
    name: 'active',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockHealthStatus = {
    status: 'OK',
    timestamp: '2024-01-15T10:30:00.000Z',
    database: 'connected',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatusController],
      providers: [
        {
          provide: StatusService,
          useValue: {
            getStatus: jest.fn(),
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

  describe('getStatus', () => {
    it('should return API health status', async () => {
      service.getStatus.mockResolvedValue(mockHealthStatus);

      const result = await controller.getStatus();

      expect(result).toBe(mockHealthStatus);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getStatus).toHaveBeenCalled();
    });
  });

  describe('getStatusByCategory', () => {
    it('should return statuses for given category', async () => {
      const mockStatuses = [mockStatus];
      service.findByCategory.mockResolvedValue(mockStatuses);

      const result = await controller.getStatusByCategory('user');

      expect(result).toBe(mockStatuses);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findByCategory).toHaveBeenCalledWith('user');
    });

    it('should throw BadRequestException for invalid category', () => {
      expect(() => controller.getStatusByCategory('nonexistent')).toThrow(
        BadRequestException,
      );
    });

    it('should accept valid categories', async () => {
      const validCategories = ['user', 'board', 'block', 'invitation'];

      for (const category of validCategories) {
        service.findByCategory.mockResolvedValue([]);

        const result = await controller.getStatusByCategory(category);

        expect(result).toEqual([]);
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(service.findByCategory).toHaveBeenCalledWith(category);
      }
    });
  });
});
 