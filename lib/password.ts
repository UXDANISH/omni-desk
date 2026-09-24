import { createHash, randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

const COST = 12;

export const hashSecret = (plain: string) => bcrypt.hash(plain, COST);

// Compared against when the email is unknown, so a miss takes as long as a wrong password.
let dummy: Promise<string> | undefined;
export async function verifySecret(plain: string, hash: string | null | undefined) {
  const ok = await bcrypt.compare(plain, hash ?? (await (dummy ??= bcrypt.hash('not-a-real-secret', COST))));
  return ok && !!hash;
}

export const PASSWORD_RULE = { min: 10, message: 'Use at least 10 characters.' };

/** Random URL-safe token for invite / reset links. Store only `hashToken(token)`. */
export const newToken = () => randomBytes(32).toString('base64url');
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const newId = (prefix = '') => prefix + randomUUID().replace(/-/g, '').slice(0, 12);
