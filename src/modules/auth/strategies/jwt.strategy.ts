import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface AccessTokenPayload {
  sub: string;
  type: 'access';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET') || 'secret_key';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: unknown) {
    // Vérifier que c'est bien un access token
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof (payload as AccessTokenPayload).sub !== 'string' ||
      (payload as AccessTokenPayload).type !== 'access'
    ) {
      throw new UnauthorizedException(
        'Token invalide - access token requis pour cette route',
      );
    }

    const accessPayload = payload as AccessTokenPayload;

    return {
      id: accessPayload.sub,
    };
  }
}
