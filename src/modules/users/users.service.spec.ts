import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { RolesService } from '../roles/roles.service';
import { StatusService } from '../status/status.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;
  let userRoleRepository: jest.Mocked<Repository<UserRole>>;
  let rolesService: jest.Mocked<RolesService>;
  let statusService: jest.Mocked<StatusService>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    displayName: 'Test User',
    passwordHash: 'hashedPassword',
    statusId: 'status-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    userRoles: [
      {
        role: { name: 'user', description: 'Utilisateur standard' },
      },
    ],
  } as unknown as User;

  const mockRole = {
    id: 'role-id',
    name: 'user',
    description: 'Utilisateur standard',
  };

  const mockStatus = {
    id: 'status-id',
    category: 'user',
    name: 'active',
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const mockUserRoleRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockRolesService = {
      findByName: jest.fn(),
    };

    const mockStatusService = {
      findByCategoryAndName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: mockUserRoleRepository,
        },
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
        {
          provide: StatusService,
          useValue: mockStatusService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    userRoleRepository = module.get(getRepositoryToken(UserRole));
    rolesService = module.get(RolesService);
    statusService = module.get(StatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto = {
      email: 'test@example.com',
      password: 'Password123!',
      displayName: 'Test User',
    };

    it('should create a user successfully', async () => {
      userRepository.findOne.mockResolvedValue(null);
      statusService.findByCategoryAndName.mockResolvedValue(mockStatus as any);
      rolesService.findByName.mockResolvedValue(mockRole as any);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      userRoleRepository.create.mockReturnValue({} as any);
      userRoleRepository.save.mockResolvedValue({} as any);
      jest.spyOn(service, 'findById').mockResolvedValue({} as any);

      const result = await service.create(createUserDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email, deletedAt: expect.anything() },
      });
      expect(statusService.findByCategoryAndName).toHaveBeenCalledWith(
        'user',
        'active',
      );
      expect(rolesService.findByName).toHaveBeenCalledWith('user');
      expect(result).toBeDefined();
    });

    it('should throw ConflictException when user already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException when default status not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      statusService.findByCategoryAndName.mockResolvedValue(null);

      await expect(service.create(createUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(result).toBeDefined();
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id, deletedAt: expect.anything() },
        relations: ['userRoles', 'userRoles.role'],
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(result).toBe(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email, deletedAt: expect.anything() },
        relations: ['userRoles', 'userRoles.role'],
      });
    });

    it('should return null when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });
}); 