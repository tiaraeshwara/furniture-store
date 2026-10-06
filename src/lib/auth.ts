import { verify } from 'jsonwebtoken';

export function verifyAdminToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized access');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verify(token, process.env.JWT_SECRET!) as { role: string; userId: string };

  if (decoded.role !== 'ADMIN') {
    throw new Error('Forbidden: Administrative rights required');
  }

  return decoded;
}