import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(plainPassword) {
  if (!plainPassword) return '';
  return await bcrypt.hash(String(plainPassword), SALT_ROUNDS);
}

export async function comparePassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) return false;
  // If plain matches directly (e.g. initial demo seed before migration)
  if (plainPassword === hashedPassword) return true;
  try {
    return await bcrypt.compare(String(plainPassword), String(hashedPassword));
  } catch {
    return false;
  }
}

