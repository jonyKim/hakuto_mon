import request from 'supertest';
import express from 'express';
import { AuthService } from '../application/auth.service';
import { AuthController } from '../interfaces/auth.controller';
import { createAuthRouter } from '../interfaces/auth.routes';
import { JwtService } from '../application/jwt.service';
import { SupabaseAuthRepository } from '../infrastructure/auth.repository';

describe('Auth System Tests', () => {
    let app: express.Express;
    let authService: AuthService;
    let jwtService: JwtService;
    let testToken: string;

    beforeAll(() => {
        // 테스트용 의존성 주입
        const authRepository = new SupabaseAuthRepository();
        jwtService = new JwtService();
        authService = new AuthService(authRepository, jwtService);
        const authController = new AuthController(authService);

        // Express 앱 설정
        app = express();
        app.use(express.json());
        app.use('/api/admin/auth', createAuthRouter(authController));

        // 테스트용 토큰 생성
        testToken = jwtService.generateToken({
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test Admin',
            password_hash: 'test-hash',
            role: 'admin',
            wallet_address: 'test-wallet',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        });
    });

    describe('Authentication Flow', () => {
        it('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/admin/auth/login')
                .send({
                    email: 'admin@example.com',
                    password: 'admin123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
        });

        it('should fail login with invalid credentials', async () => {
            const response = await request(app)
                .post('/api/admin/auth/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'wrongpass'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Token Validation', () => {
        it('should validate token successfully', async () => {
            const response = await request(app)
                .get('/api/admin/auth/test/token')
                .set('Cookie', [`auth-token=${testToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toBeDefined();
        });

        it('should fail with invalid token', async () => {
            const response = await request(app)
                .get('/api/admin/auth/test/token')
                .set('Cookie', ['auth-token=invalid-token']);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Role-Based Access', () => {
        it('should allow admin access', async () => {
            const response = await request(app)
                .get('/api/admin/auth/test/role')
                .set('Cookie', [`auth-token=${testToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should deny non-admin access', async () => {
            // 일반 사용자 토큰 생성
            const userToken = jwtService.generateToken({
                id: 'user-id',
                email: 'user@example.com',
                name: 'Test User',
                password_hash: 'test-hash',
                role: 'user',
                wallet_address: 'user-wallet',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            });

            const response = await request(app)
                .get('/api/admin/auth/test/role')
                .set('Cookie', [`auth-token=${userToken}`]);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('User Information', () => {
        it('should retrieve user information', async () => {
            const response = await request(app)
                .get('/api/admin/auth/test/user')
                .set('Cookie', [`auth-token=${testToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toBeDefined();
        });
    });
}); 