import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  UseInterceptors,
  ClassSerializerInterceptor,
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
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RevokeTokenDto } from './dto/revoke-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
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

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renouvellement des tokens',
    description:
      'Génère de nouveaux tokens à partir du refresh token fourni dans le body',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Tokens renouvelés avec succès',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalide ou expiré',
  })
  @ApiResponse({
    status: 400,
    description: 'Données de refresh invalides',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    this.logger.log('Demande de renouvellement de token');
    try {
      const result = await this.authService.refreshToken(
        refreshTokenDto.refreshToken,
      );
      this.logger.log('Token renouvelé avec succès');
      return result;
    } catch (error) {
      this.logger.error(
        `Erreur lors du renouvellement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
      throw error;
    }
  }

  @Post('revoke')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Révocation de token',
    description:
      'Révoque un token (access ou refresh) pour empêcher son utilisation future',
  })
  @ApiBody({ type: RevokeTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token révoqué avec succès',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Token révoqué avec succès',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token invalide ou non autorisé',
  })
  @ApiResponse({
    status: 400,
    description: 'Données de révocation invalides',
  })
  async revokeToken(@Body() revokeTokenDto: RevokeTokenDto): Promise<{
    message: string;
  }> {
    this.logger.log('Demande de révocation de token');
    try {
      await this.authService.revokeToken(revokeTokenDto.token);
      this.logger.log('Token révoqué avec succès');
      return { message: 'Token révoqué avec succès' };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la révocation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
      throw error;
    }
  }
}
