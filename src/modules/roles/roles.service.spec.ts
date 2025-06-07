import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';

describe('RolesService', () => {
  let service: RolesService;
  let repository: jest.Mocked<Repository<Role>>;

  const mockRole = {
    id: 'test-id',
    name: 'user',
    description: 'Utilisateur standard',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    deletedBy: undefined,
  } as Role;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    repository = module.get(getRepositoryToken(Role));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByName', () => {
    it('should return role when found', async () => {
      repository.findOne.mockResolvedValue(mockRole);

      const result = await service.findByName('user');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { name: 'user', deletedAt: IsNull() },
      });
      expect(result).toBe(mockRole);
    });

    it('should return null when role not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByName('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      const mockRoles = [mockRole];
      repository.find.mockResolvedValue(mockRoles);

      const result = await service.findAll();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.find).toHaveBeenCalledWith({
        where: { deletedAt: IsNull() },
        order: { name: 'ASC' },
      });
      expect(result).toBe(mockRoles);
    });

    it('should return empty array when no roles found', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });
});
