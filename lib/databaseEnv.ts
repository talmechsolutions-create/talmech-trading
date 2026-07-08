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
