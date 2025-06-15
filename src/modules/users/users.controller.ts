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
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

interface JwtUser {
  id: string;
  email: string;
}

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(
      `Requête de création d'utilisateur: ${createUserDto.email}`,
    );

    try {
      const user = await this.usersService.create(createUserDto);
      this.logger.log(`Utilisateur créé avec succès: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création de l'utilisateur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
      throw error;
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async findById(
    @Param('id') id: string,
    @Request() req: { user: JwtUser },
  ): Promise<UserResponseDto> {
    this.logger.log(`Requête de récupération d'utilisateur: ${id}`);

    if (req.user.id !== id) {
      throw new ForbiddenException(
        'Vous ne pouvez consulter que votre propre profil',
      );
    }

    try {
      const user = await this.usersService.findById(id);
      this.logger.log(`Utilisateur trouvé: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération de l'utilisateur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
      throw error;
    }
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: { user: JwtUser },
  ): Promise<UserResponseDto> {
    this.logger.log(`Requête de mise à jour d'utilisateur: ${id}`);

    if (req.user.id !== id) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que votre propre profil',
      );
    }

    try {
      const user = await this.usersService.update(id, updateUserDto);
      this.logger.log(`Utilisateur mis à jour avec succès: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour de l'utilisateur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
      throw error;
    }
  }
}
