import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusService } from './status.service';
import { Status } from './entities/status.entity';

describe('StatusService', () => {
  let service: StatusService;
  let repository: jest.Mocked<Repository<Status>>;

  const mockStatus = {
    id: 'test-id',
    category: 'user',
    name: 'active',
    isActive: true,
  } as Status;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusService,
        {
          provide: getRepositoryToken(Status),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<StatusService>(StatusService);
    repository = module.get(getRepositoryToken(Status));
  });

  describe('findByCategoryAndName', () => {
    it('should return status when found', async () => {
      repository.findOne.mockResolvedValue(mockStatus);

      const result = await service.findByCategoryAndName('user', 'active');

      expect(result).toStrictEqual(mockStatus);
    });

    it('should return null when status not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByCategoryAndName('user', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCategory', () => {
    it('should return statuses for category', async () => {
      const mockStatuses = [mockStatus];
      repository.find.mockResolvedValue(mockStatuses);

      const result = await service.findByCategory('user');

      expect(result).toStrictEqual(mockStatuses);
    });

    it('should return empty array when no statuses found', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findByCategory('nonexistent');

      expect(result).toEqual([]);
    });
  });
});
