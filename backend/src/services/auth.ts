import jwt, { JwtPayload } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { sha256 } from '../utils/hash';
import crypto from 'crypto';

export async function issueTokensForUser(
  userId: string,
  meta: { userAgent?: string; ip?: string }
) {
  const jti = crypto.randomUUID();

  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId, jti);

  const decoded = jwt.decode(refreshToken) as JwtPayload | null;
  const expiresAt =
    decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: sha256(refreshToken),
      userAgent: meta.userAgent,
      ip: meta.ip,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}
