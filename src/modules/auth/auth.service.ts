import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthUserDto } from './dto/auth-user.dto';
import { User } from '../users/entities/user.entity';

interface AccessTokenPayload {
  sub: string;
  type: 'access';
  iat?: number;
  exp?: number;
}

interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Tentative de connexion pour: ${loginDto.email}`);

    const user = await this.validateUser(loginDto.email, loginDto.password);
    const { access_token, refresh_token } = this.generateTokens(user);

    this.logger.log(`Connexion réussie pour: ${user.email}`);

    const authUser: AuthUserDto = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };

    return {
      access_token,
      refresh_token,
      user: authUser,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    this.logger.log('Tentative de renouvellement de token');

    try {
      const rawPayload = this.jwtService.verify(refreshToken) as unknown;

      if (!this.isValidRefreshTokenPayload(rawPayload)) {
        throw new UnauthorizedException(
          'Token invalide - seuls les refresh tokens sont acceptés',
        );
      }

      const user = await this.usersService.findByIdEntity(rawPayload.sub);

      if (!user) {
        throw new UnauthorizedException('Utilisateur introuvable');
      }

      const { access_token, refresh_token } = this.generateTokens(user);

      this.logger.log(`Token renouvelé pour: ${user.email}`);

      const authUser: AuthUserDto = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      };

      return {
        access_token,
        refresh_token,
        user: authUser,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors du renouvellement: ${
          error instanceof Error ? error.message : 'Erreur inconnue'
        }`,
      );
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }

  async revokeToken(token: string): Promise<void> {
    this.logger.log('Tentative de révocation de token');

    try {
      const decoded = this.jwtService.decode(token) as {
        exp?: number;
        sub?: string;
      } | null;

      if (!decoded || !decoded.exp) {
        throw new UnauthorizedException('Token invalide');
      }

      const expirationTime = decoded.exp * 1000 - Date.now();

      if (expirationTime <= 0) {
        this.logger.log('Token déjà expiré, révocation ignorée');
        return Promise.resolve();
      }

      // TODO: Implémenter le stockage Redis pour la blacklist
      // Pour l'instant, on log simplement l'action
      this.logger.log(
        `Token révoqué avec succès. Expiration dans ${expirationTime}ms`,
      );

      // Dans une implémentation complète, on ferait :
      // await this.redisService.set(`blacklist:${token}`, 'revoked', expirationTime);
      return Promise.resolve();
    } catch (error) {
      this.logger.error(
        `Erreur lors de la révocation: ${
          error instanceof Error ? error.message : 'Erreur inconnue'
        }`,
      );
      throw new UnauthorizedException('Impossible de révoquer le token');
    }
  }

  isTokenRevoked(token: string): Promise<boolean> {
    try {
      // TODO: Vérifier dans Redis si le token est dans la blacklist
      // Pour l'instant, on retourne toujours false
      // return await this.redisService.get(`blacklist:${token}`) === 'revoked';
      return Promise.resolve(false);
    } catch (error) {
      this.logger.error('Erreur lors de la vérification de révocation:', error);
      return Promise.resolve(false);
    }
  }

  async refreshTokenFromUserId(userId: string): Promise<AuthResponseDto> {
    this.logger.log(
      `Génération de nouveaux tokens pour l'utilisateur: ${userId}`,
    );

    try {
      const user = await this.usersService.findByIdEntity(userId);

      if (!user) {
        throw new UnauthorizedException('Utilisateur introuvable');
      }

      const { access_token, refresh_token } = this.generateTokens(user);

      this.logger.log(`Nouveaux tokens générés pour: ${user.email}`);

      const authUser: AuthUserDto = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      };

      return {
        access_token,
        refresh_token,
        user: authUser,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la génération des tokens: ${
          error instanceof Error ? error.message : 'Erreur inconnue'
        }`,
      );
      throw new UnauthorizedException(
        'Impossible de générer de nouveaux tokens',
      );
    }
  }

  validateAccessToken(token: string): AccessTokenPayload {
    try {
      const rawPayload = this.jwtService.verify(token) as unknown;

      if (!this.isValidAccessTokenPayload(rawPayload)) {
        throw new UnauthorizedException('Token invalide - access token requis');
      }

      return rawPayload;
    } catch {
      throw new UnauthorizedException('Access token invalide ou expiré');
    }
  }

  validateRefreshToken(token: string): RefreshTokenPayload {
    try {
      const rawPayload = this.jwtService.verify(token) as unknown;

      if (!this.isValidRefreshTokenPayload(rawPayload)) {
        throw new UnauthorizedException(
          'Token invalide - refresh token requis',
        );
      }

      return rawPayload;
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }

  private generateTokens(user: User): {
    access_token: string;
    refresh_token: string;
  } {
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      type: 'access',
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      type: 'refresh',
    };

    const access_token = this.jwtService.sign(accessPayload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRATION', '3h'),
    });

    const refresh_token = this.jwtService.sign(refreshPayload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '1d'),
    });

    return { access_token, refresh_token };
  }

  private isValidAccessTokenPayload(
    payload: unknown,
  ): payload is AccessTokenPayload {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      typeof (payload as AccessTokenPayload).sub === 'string' &&
      (payload as AccessTokenPayload).type === 'access'
    );
  }

  private isValidRefreshTokenPayload(
    payload: unknown,
  ): payload is RefreshTokenPayload {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      typeof (payload as RefreshTokenPayload).sub === 'string' &&
      (payload as RefreshTokenPayload).type === 'refresh'
    );
  }
}
