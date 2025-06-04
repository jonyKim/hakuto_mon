import { jest } from '@jest/globals';
import { SupabaseClient } from '@supabase/supabase-js';

interface MockData {
    [key: string]: any[];
    users: any[];
}

const mockData: MockData = {
    users: [],
};

type MockSupabaseResponse<T> = Promise<{
    data: T | null;
    error: null;
}>;

export const mockSupabaseClient = {
    from: jest.fn((table: string) => ({
        select: jest.fn().mockImplementation((): MockSupabaseResponse<any[]> => 
            Promise.resolve({ data: mockData[table], error: null })),
        insert: jest.fn().mockImplementation((): MockSupabaseResponse<any[]> => 
            Promise.resolve({ data: [], error: null })),
        update: jest.fn().mockImplementation((): MockSupabaseResponse<any[]> => 
            Promise.resolve({ data: [], error: null })),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation((): MockSupabaseResponse<any> => 
            Promise.resolve({ data: null, error: null })),
    })),
} as unknown as SupabaseClient;

// Supabase 클라이언트 모킹
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => mockSupabaseClient),
}));

// 연결 테스트 모킹
jest.mock('../../infrastructure/supabase', () => ({
    supabase: mockSupabaseClient,
})); 