import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Status } from '../status/entities/status.entity';
import { StatusService } from '../status/status.service';
import { EmailService } from '../email/email.service';
import { InvitationService } from '../invitation/invitation.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;
  let statusService: jest.Mocked<StatusService>;
  let emailService: jest.Mocked<EmailService>;

  const mockStatus = {
    id: 'user-active',
    category: 'user',
    name: 'active',
    isActive: true,
  } as Status;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    passwordHash: 'hashedPassword',
    statusId: 'status-id',
    status: mockStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: StatusService,
          useValue: {
            findByCategoryAndName: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendWelcome: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: InvitationService,
          useValue: {
            processPendingInvitations: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    statusService = module.get(StatusService);
    emailService = module.get(EmailService);
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
      emailService.sendWelcome.mockResolvedValue(undefined);
      jest.spyOn(service, 'findById').mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        displayName: mockUser.displayName,
        updatedAt: new Date(),
      });

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
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
      expect(result.id).toBe(mockUser.id);
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
    });

    it('should return null when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });
});
