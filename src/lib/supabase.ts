import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Cliente Supabase único do app.
 * Nunca instancie outro createClient fora daqui.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});