import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

const accessOpts: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES };
const refreshOpts: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES };

export function signAccessToken(userId: string): string {
  const secret: Secret = env.JWT_ACCESS_SECRET;
  return jwt.sign({ sub: userId }, secret, accessOpts);
}

export function signRefreshToken(userId: string, jti?: string): string {
  const secret: Secret = env.JWT_REFRESH_SECRET;
  return jwt.sign({ sub: userId, jti }, secret, refreshOpts);
}
