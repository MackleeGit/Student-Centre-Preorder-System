import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🔍 ENV CHECK:");
console.log("VITE_SUPABASE_URL =", SUPABASE_URL);
console.log("VITE_SUPABASE_ANON_KEY =", SUPABASE_ANON_KEY?.slice(0, 8) + '...');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("❌ Supabase env vars not loaded! Check your `.env` and `vite.config.js`.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };
