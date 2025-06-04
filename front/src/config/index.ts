// API 설정
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
export const API_SERVER_URL = process.env.NEXT_PUBLIC_API_SERVER_URL || 'http://localhost:3001';

// 환경 설정
export const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';

// CORS 설정
export const ALLOWED_ORIGINS = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS || 'http://localhost:3000';

// 쿠키 설정
export const COOKIE_NAME = 'auth-token';
export const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24시간 

// Polygon Scan 설정
export const POLYGON_SCAN_SITE = process.env.NEXT_PUBLIC_POLYGON_SCAN_SITE || 'https://polygonscan.com';
