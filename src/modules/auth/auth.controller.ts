import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Tentative de connexion: ${loginDto.email}`);

    try {
      const result = await this.authService.login(loginDto);
      this.logger.log(`Connexion réussie: ${loginDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
      throw error;
    }
  }
}
