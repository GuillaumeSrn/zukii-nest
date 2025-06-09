import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    deletedBy: undefined,
  } as Status;

  beforeEach(async () => {
    const mockDataSource = {
      getRepository: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusService,
        {
          provide: getRepositoryToken(Status),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<StatusService>(StatusService);
    repository = module.get(getRepositoryToken(Status));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByCategoryAndName', () => {
    it('should return status when found', async () => {
      repository.findOne.mockResolvedValue(mockStatus);

      const result = await service.findByCategoryAndName('user', 'active');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { category: 'user', name: 'active', isActive: true },
      });
      expect(result).toBe(mockStatus);
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

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.find).toHaveBeenCalledWith({
        where: { category: 'user', isActive: true },
        order: { name: 'ASC' },
      });
      expect(result).toBe(mockStatuses);
    });

    it('should return empty array when no statuses found', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findByCategory('nonexistent');

      expect(result).toEqual([]);
    });
  });
});
