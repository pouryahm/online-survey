import jwt, { JwtPayload } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { sha256 } from '../utils/hash';
import { env } from '../config/env';

export async function verifyRefreshTokenOrThrow(refreshToken: string) {
  // 1) امضای JWT را با کلید رفرش بررسی کن
  const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
  const userId = typeof payload.sub === 'string' ? payload.sub : null;
  if (!userId) {
    throw new Error('INVALID_TOKEN');
  }

  // 2) مطابقت با رکورد DB از طریق هش
  const tokenHash = sha256(refreshToken);
  const rec = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!rec) throw new Error('TOKEN_NOT_FOUND');
  if (rec.revokedAt) throw new Error('TOKEN_REVOKED');

  // 3) انقضا (لایهٔ دوم، هرچند verify خودش exp را چک می‌کند)
  if (rec.expiresAt.getTime() <= Date.now()) throw new Error('TOKEN_EXPIRED');

  return { userId, record: rec };
}

export async function revokeRefreshTokenById(id: string) {
  await prisma.refreshToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}
