import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly rolesService: RolesService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Création d'un nouvel utilisateur: ${createUserDto.email}`);

    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email, deletedAt: IsNull() },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

    const user = this.userRepository.create({
      email: createUserDto.email,
      displayName: createUserDto.displayName,
      passwordHash,
    });

    const savedUser = await this.userRepository.save(user);

    const userRole = await this.rolesService.findByName('user');
    if (!userRole) {
      throw new NotFoundException('Rôle par défaut "user" non trouvé');
    }

    const userRoleEntity = this.userRoleRepository.create({
      userId: savedUser.id,
      roleId: userRole.id,
    });

    await this.userRoleRepository.save(userRoleEntity);

    this.logger.log(
      `Utilisateur créé avec succès: ${savedUser.email} (ID: ${savedUser.id})`,
    );

    // Retourner l'utilisateur avec ses rôles
    return this.findById(savedUser.id);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return this.transformToResponse(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
      relations: ['userRoles', 'userRoles.role'],
    });
  }

  private transformToResponse(user: User): UserResponseDto {
    const response = new UserResponseDto();
    response.id = user.id;
    response.email = user.email;
    response.displayName = user.displayName;
    response.createdAt = user.createdAt;
    response.updatedAt = user.updatedAt;
    response.roles =
      user.userRoles?.map((ur) => ({
        name: ur.role.name,
        description: ur.role.description,
      })) || [];

    return response;
  }
}
