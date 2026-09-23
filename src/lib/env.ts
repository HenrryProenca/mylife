/**
 * Valida e expõe variáveis de ambiente de forma tipada.
 * Se faltar alguma, falha no boot (melhor que quebrar em runtime).
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `[env] Variável de ambiente obrigatória ausente: ${name}. ` +
        `Verifique seu arquivo .env.local`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: required(
    'VITE_SUPABASE_ANON_KEY',
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  ),
  appName: import.meta.env.VITE_APP_NAME ?? 'MyLife',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;