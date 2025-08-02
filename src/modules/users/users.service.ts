import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { StatusService } from '../status/status.service';
import { UserStatus } from '../status/enums/status.enum';
import { EmailService } from '../email/email.service';
import { InvitationService } from '../invitation/invitation.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly statusService: StatusService,
    private readonly emailService: EmailService,
    private readonly invitationService: InvitationService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Création d'un nouvel utilisateur: ${createUserDto.email}`);

    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const activeStatus = await this.statusService.findByCategoryAndName(
      'user',
      'active',
    );

    if (!activeStatus) {
      throw new NotFoundException(
        'Status "user.active" introuvable ou incorrect',
      );
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

    const user = this.userRepository.create({
      email: createUserDto.email,
      displayName: createUserDto.displayName || createUserDto.email,
      passwordHash,
      statusId: UserStatus.ACTIVE,
    });

    const savedUser = await this.userRepository.save(user);

    this.logger.log(
      `Utilisateur créé avec succès: ${savedUser.email} (ID: ${savedUser.id})`,
    );

    // Traiter les invitations en attente pour cet email
    await this.invitationService.processPendingInvitations(
      savedUser.email,
      savedUser.id,
    );

    await this.emailService.sendWelcome(savedUser.email, savedUser.displayName);

    return this.findById(savedUser.id);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['status'],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return this.toUserResponseDto(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['status'],
    });
  }

  async findByIdEntity(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['status'],
    });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    return this.findById(updatedUser.id);
  }

  private toUserResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      updatedAt: user.updatedAt,
    };
  }
}
