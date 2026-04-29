// db.js — wraps the Supabase client.
// Uses Supabase's official ESM build straight from the CDN: no npm, no bundler.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STORE_KEY = 'bizmgr.creds.v1';

let client = null;

/** Read saved credentials (or null). */
export function getCreds() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Save creds + (re)build the client. */
export function setCreds({ url, key }) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ url, key }));
  client = createClient(url, key);
  return client;
}

/** Forget creds. Used by Logout. */
export function clearCreds() {
  localStorage.removeItem(STORE_KEY);
  client = null;
}

/** Get the live client. Throws a friendly error if no creds saved yet. */
export function db() {
  if (client) return client;
  const c = getCreds();
  if (!c) throw new Error('No database credentials yet. Open Settings to set them up.');
  client = createClient(c.url, c.key);
  return client;
}

/** Quick connection check. Returns { ok, message }. */
export async function testConnection(url, key) {
  try {
    const tmp = createClient(url, key);
    // Touch every required table — gives the user one error per missing table.
    const tables = ['customers', 'customer_transactions', 'expenses', 'loans', 'loan_transactions'];
    for (const t of tables) {
      const { error } = await tmp.from(t).select('id').limit(1);
      if (error) {
        return {
          ok: false,
          message:
            `Could not read table "${t}". ` +
            `Did you run supabase-schema.sql in the SQL editor? ` +
            `(${error.message})`
        };
      }
    }
    return { ok: true, message: 'Connected. All five tables are reachable.' };
  } catch (e) {
    return { ok: false, message: e.message || String(e) };
  }
}
