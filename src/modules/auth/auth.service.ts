import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { User } from '../users/entities/user.entity';

interface TokenPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    this.logger.log('Tentative de renouvellement de token');

    try {
      const rawPayload = this.jwtService.verify(refreshTokenDto.refresh_token);

      if (!this.isValidTokenPayload(rawPayload)) {
        throw new UnauthorizedException('Payload du token invalide');
      }

      const user = await this.usersService.findByIdEntity(rawPayload.sub);

      if (!user) {
        throw new UnauthorizedException('Utilisateur introuvable');
      }

      const { access_token, refresh_token } = this.generateTokens(user);

      this.logger.log(`Token renouvelé pour: ${user.email}`);

      return {
        access_token,
        refresh_token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
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

  private generateTokens(user: User): {
    access_token: string;
    refresh_token: string;
  } {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRATION,
    });
    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION,
    });

    return { access_token, refresh_token };
  }

  private isValidTokenPayload(payload: unknown): payload is TokenPayload {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      typeof (payload as TokenPayload).sub === 'string' &&
      typeof (payload as TokenPayload).email === 'string'
    );
  }
}
