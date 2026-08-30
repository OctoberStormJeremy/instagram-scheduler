export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getRedisUrl() {
  return process.env.REDIS_URL ?? 'redis://localhost:6379';
}
