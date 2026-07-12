const DATABASE_ENV_KEYS = [
  'DATABASE_URL',
  'DATABASE_POSTGRES_URL',
  'DATABASE_PRISMA_DATABASE_URL',
] as const;

export function getDatabaseUrl() {
  for (const key of DATABASE_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return '';
}

export function hasDatabaseUrl() {
  return Boolean(getDatabaseUrl());
}

export function ensurePrismaDatabaseEnv() {
  const value = getDatabaseUrl();
  if (value && !(process.env.DATABASE_POSTGRES_URL || '').trim()) {
    process.env.DATABASE_POSTGRES_URL = value;
  }
  return value;
}

export function productionDatabaseError() {
  if (process.env.NODE_ENV !== 'production' || hasDatabaseUrl()) return '';
  return 'Production database is not configured. Set DATABASE_POSTGRES_URL, DATABASE_URL, or DATABASE_PRISMA_DATABASE_URL.';
}
