import { hasDatabaseUrl } from '@/lib/databaseEnv';

export { hasDatabaseUrl } from '@/lib/databaseEnv';

export const PRODUCTION_DATABASE_REQUIRED_MESSAGE =
  'Production database is not configured. Please configure DATABASE_POSTGRES_URL or DATABASE_URL before creating accounts/listings.';

export const PRODUCTION_DATABASE_UNAVAILABLE_MESSAGE =
  'Production database is not available. Please check DATABASE_POSTGRES_URL, DATABASE_URL, and Prisma setup before saving business data.';

export type StorageMode = 'database' | 'json-local' | 'blocked';

export class StorageModeError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 503) {
    super(message);
    this.name = 'StorageModeError';
    this.code = code;
    this.status = status;
  }
}

export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function isVercel() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV);
}

export function canUseJsonFileStorage() {
  return !isProduction();
}

export function getStorageMode(): StorageMode {
  if (hasDatabaseUrl()) return 'database';
  return canUseJsonFileStorage() ? 'json-local' : 'blocked';
}

export function requirePersistentStorage() {
  if (isProduction() && !hasDatabaseUrl()) {
    throw new StorageModeError('PRODUCTION_DATABASE_REQUIRED', PRODUCTION_DATABASE_REQUIRED_MESSAGE, 503);
  }
}

export function requireJsonFileStorage() {
  if (!canUseJsonFileStorage()) {
    throw new StorageModeError('PRODUCTION_DATABASE_REQUIRED', PRODUCTION_DATABASE_REQUIRED_MESSAGE, 503);
  }
}

export function persistentStorageUnavailable() {
  return new StorageModeError('PRODUCTION_DATABASE_UNAVAILABLE', PRODUCTION_DATABASE_UNAVAILABLE_MESSAGE, 503);
}

export function isStorageModeError(error: unknown): error is StorageModeError {
  return error instanceof StorageModeError || (
    Boolean(error) &&
    typeof error === 'object' &&
    typeof (error as any).code === 'string' &&
    typeof (error as any).message === 'string' &&
    ['PRODUCTION_DATABASE_REQUIRED', 'PRODUCTION_DATABASE_UNAVAILABLE'].includes((error as any).code)
  );
}

export function publicStorageError(error: unknown) {
  if (!isStorageModeError(error)) return null;
  return {
    ok: false,
    code: error.code,
    message: error.message,
    error: error.message,
    status: error.status || 503,
  };
}
