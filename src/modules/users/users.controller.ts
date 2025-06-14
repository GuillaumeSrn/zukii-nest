import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  ValidationPipe,
  UsePipes,
  Logger,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PublicUserDto } from './dto/public-user.dto';
import { UsersService } from './users.service';
import { Public } from '../../common/decorators/public.decorator';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';

interface JwtUser {
  id: string;
}

@ApiTags('Utilisateurs')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Créer un nouvel utilisateur',
    description: "Création d'un compte utilisateur",
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Données d'entrée invalides",
  })
  @ApiResponse({
    status: 409,
    description: 'Email déjà utilisé',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(
      `Requête de création d'utilisateur: ${createUserDto.email}`,
    );
    const user = await this.usersService.create(createUserDto);
    this.logger.log(`Utilisateur créé avec succès: ${user.email}`);
    return user;
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer son propre profil',
    description: "Récupère le profil complet de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: "Profil complet de l'utilisateur connecté",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT requis',
  })
  async getMe(@Request() req: { user: JwtUser }): Promise<UserResponseDto> {
    this.logger.log(`Requête de profil personnel pour: ${req.user.id}`);
    const user = await this.usersService.findById(req.user.id);
    this.logger.log(`Profil personnel retourné pour: ${user.email}`);
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      updatedAt: user.updatedAt,
    };
  }

  @Get(':id/public')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Récupérer le profil public d'un utilisateur",
    description:
      "Récupère uniquement les informations publiques d'un utilisateur",
  })
  @ApiParam({
    name: 'id',
    description: "Identifiant UUID de l'utilisateur",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: "Profil public de l'utilisateur",
    type: PublicUserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'UUID invalide',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  async getPublicProfile(
    @Param('id', UuidValidationPipe) id: string,
  ): Promise<PublicUserDto> {
    this.logger.log(`Requête de profil public pour: ${id}`);
    const user = await this.usersService.findById(id);
    this.logger.log(`Profil public retourné pour l'utilisateur: ${id}`);
    return {
      id: user.id,
      displayName: user.displayName,
      isActive: true,
    };
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Mettre à jour un utilisateur',
    description:
      "Modification des informations d'un utilisateur (utilisateur connecté uniquement)",
  })
  @ApiParam({
    name: 'id',
    description: "Identifiant UUID de l'utilisateur",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur mis à jour avec succès',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'UUID invalide',
  })
  @ApiResponse({
    status: 403,
    description:
      'Non autorisé - vous ne pouvez modifier que votre propre profil',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: { user: JwtUser },
  ): Promise<UserResponseDto> {
    this.logger.log(`Requête de mise à jour d'utilisateur: ${id}`);

    if (req.user.id !== id) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que votre propre profil',
      );
    }

    const user = await this.usersService.update(id, updateUserDto);
    this.logger.log(`Utilisateur mis à jour avec succès: ${user.email}`);
    return user;
  }
}
