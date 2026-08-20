type EnvMap = Record<string, string | undefined>;

const metaEnv = (import.meta as unknown as { env?: EnvMap }).env ?? {};

export function env(key: string): string {
  return metaEnv[key] ?? process.env[key] ?? "";
}