import { createClient } from '@supabase/supabase-js';
import { shouldEnableCloudServices } from '../utils/envUtils';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseAnonKey) {
    // Silent failure or handle appropriately without console spam
}

// Only initialize Supabase if allowed in the current environment
const isEnabled = shouldEnableCloudServices();

export const supabase = isEnabled ? createClient(
    supabaseUrl,
    supabaseAnonKey
) : null;

if (!isEnabled) {
    // Silent
}


