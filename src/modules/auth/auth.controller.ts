import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Logger,
  UseInterceptors,
  ClassSerializerInterceptor,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshJwtAuthGuard } from './guards/refresh-jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

interface JwtUser {
  id: string;
}

@ApiTags('Authentification')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Connexion utilisateur',
    description: 'Authentifie un utilisateur avec email et mot de passe',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Email ou mot de passe incorrect',
  })
  @ApiResponse({
    status: 400,
    description: 'Données de connexion invalides',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Tentative de connexion pour: ${loginDto.email}`);
    try {
      const result = await this.authService.login(loginDto);
      this.logger.log(`Connexion réussie pour: ${loginDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la connexion pour ${loginDto.email}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
      throw error;
    }
  }

  @UseGuards(RefreshJwtAuthGuard)
  @Post('refresh')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renouvellement des tokens',
    description:
      'Génère de nouveaux tokens à partir du refresh token (Bearer token requis)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens renouvelés avec succès',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalide ou expiré',
  })
  async refreshToken(@Request() req: { user: JwtUser }): Promise<AuthResponseDto> {
    this.logger.log(`Renouvellement de token pour l'utilisateur: ${req.user.id}`);
    try {
      const result = await this.authService.refreshTokenFromUserId(req.user.id);
      this.logger.log(`Token renouvelé avec succès pour: ${req.user.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erreur lors du renouvellement pour ${req.user.id}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
      throw error;
    }
  }
}
