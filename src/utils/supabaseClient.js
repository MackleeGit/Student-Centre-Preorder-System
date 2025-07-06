
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY


// Patch fetch to prevent CORS issues from credentials
const customFetch = (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: "omit", // This is a fix
  });
};

// Create client with global fetch override
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: customFetch
  }
});

console.log("🔥 Supabase Initialized:");

// Export for use in other JS files
export { supabase };