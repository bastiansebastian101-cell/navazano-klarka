import { NextRequest } from 'next/server';
import { COOKIE_NAME, isValidSession } from './auth';

export function requireAdmin(request: NextRequest): boolean {
  return isValidSession(request.cookies.get(COOKIE_NAME)?.value);
}
