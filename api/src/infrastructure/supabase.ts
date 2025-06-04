import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 환경 변수 로드
if (process.env.NODE_ENV === 'test') {
    dotenv.config({ path: '.env.test' });
} else {
    dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are not properly configured');
}

console.log('[supabase] Initializing client with:', {
    url: supabaseUrl,
    keyLength: supabaseKey.length
});

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test database connection
void supabase
    .from('users')
    .select('count')
    .then(({ data, error }) => {
        console.log('[supabase] Connection test result:', { data, error });
    });

export interface User {
    id: string;
    wallet_address: string;
    email: string | null;
    role: 'admin' | 'user';
    name: string | null;
    is_active: boolean;
    password_hash: string | null;
    login_attempts: number;
    locked_until: string | null;
    last_login: string | null;
    created_at: string;
    updated_at: string;
}

export * from '../types/user'; 