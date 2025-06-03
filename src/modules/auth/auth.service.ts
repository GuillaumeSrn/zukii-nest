import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    this.logger.log(`Tentative de connexion pour: ${email}`);

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Utilisateur non trouvé: ${email}`);
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`Mot de passe invalide pour: ${email}`);
      throw new UnauthorizedException('Identifiants invalides');
    }

    this.logger.log(`Connexion réussie pour: ${email}`);
    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const roles = user.userRoles?.map((userRole) => userRole.role.name) || [];

    const payload = {
      sub: user.id,
      email: user.email,
      roles,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roles,
      },
    };
  }
}
