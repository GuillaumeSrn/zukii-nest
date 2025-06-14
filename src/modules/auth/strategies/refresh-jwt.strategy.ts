import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET') || 'secret_key';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: unknown) {
    // Vérifier que c'est bien un refresh token
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof (payload as RefreshTokenPayload).sub !== 'string' ||
      (payload as RefreshTokenPayload).type !== 'refresh'
    ) {
      throw new UnauthorizedException(
        'Token invalide - refresh token requis pour cette route',
      );
    }

    const refreshPayload = payload as RefreshTokenPayload;

    return {
      id: refreshPayload.sub,
    };
  }
}
