import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  username: string;
  id?: string;
}

@Injectable()
export class AuthService {
  async validateToken(token: string): Promise<AuthenticatedUser> {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException('JWT secret not configured');
    }

    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    const username = typeof payload?.sub === 'string'
      ? payload.sub
      : typeof payload?.username === 'string'
        ? payload.username
        : null;

    if (!username) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      username,
      id: typeof payload?.id === 'string' ? payload.id : undefined,
    };
  }
}
