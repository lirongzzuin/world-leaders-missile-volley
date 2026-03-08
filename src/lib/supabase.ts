/**
 * Lazy Supabase client (singleton).
 * Server-side uses the service role key; client-side uses the anon key.
 *
 * @module supabase
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import logger from './logger';

let _client: SupabaseClient | null = null;

function validateEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
    );
  }
  return { url, anonKey };
}

/** Get (or create) the Supabase client for browser/client components */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const { url, anonKey } = validateEnv();
  _client = createClient(url, anonKey);
  logger.info('Supabase client initialized');
  return _client;
}

/** Create a fresh service-role client for server-side API routes */
export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'Missing server Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required.'
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
