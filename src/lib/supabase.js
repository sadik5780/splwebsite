import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Debug: Log environment variables (without exposing full key)
console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔑 Supabase Key present:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ MISSING SUPABASE CREDENTIALS!');
    console.error('REACT_APP_SUPABASE_URL:', supabaseUrl);
    console.error('REACT_APP_SUPABASE_ANON_KEY present:', !!supabaseAnonKey);
}

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
);

console.log('✅ Supabase client created');
