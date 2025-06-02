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
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

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
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    this.logger.log(`Requête de récupération d'utilisateur: ${id}`);

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
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`Requête de mise à jour d'utilisateur: ${id}`);

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
