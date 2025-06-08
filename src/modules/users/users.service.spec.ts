import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Status } from '../status/entities/status.entity';
import { StatusService } from '../status/status.service';
import { UserResponseDto } from './dto/user-response.dto';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;
  let statusService: jest.Mocked<StatusService>;

  const mockStatus = {
    id: 'user-active',
    category: 'user',
    name: 'active',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Status;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    displayName: 'Test User',
    passwordHash: 'hashedPassword',
    statusId: 'status-id',
    status: mockStatus,
  } as User;

  const mockUserResponse = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    displayName: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserResponseDto;

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
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
          provide: StatusService,
          useValue: mockStatusService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
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
      statusService.findByCategoryAndName.mockResolvedValue(mockStatus);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      jest.spyOn(service, 'findById').mockResolvedValue(mockUserResponse);

      const result = await service.create(createUserDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email, deletedAt: IsNull() },
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(statusService.findByCategoryAndName).toHaveBeenCalledWith(
        'user',
        'active',
      );
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
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id, deletedAt: IsNull() },
        relations: ['status'],
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
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email, deletedAt: IsNull() },
        relations: ['status'],
      });
    });

    it('should return null when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });
});
