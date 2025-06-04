import * as dotenv from 'dotenv';
import { jest } from '@jest/globals';
import './mocks/supabase';

// 환경 변수 로드
dotenv.config({ path: '.env.test' });

// 전역 타임아웃 설정
jest.setTimeout(10000);

// 전역 모의 함수 설정
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
}; 