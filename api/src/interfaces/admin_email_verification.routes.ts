import { Router } from 'express';
import { AdminEmailVerificationController } from './admin_email_verification.controller';
import { createAuthMiddleware, createAdminMiddleware } from '../middleware/auth';
import { JwtService } from '../application/jwt.service';

export function createAdminEmailVerificationRouter(controller: AdminEmailVerificationController): Router {
    const router = Router();
    const jwtService = new JwtService();

    // 어드민 인증 미들웨어 적용
    router.use(createAuthMiddleware(jwtService), createAdminMiddleware());

    // 이메일 인증 통계 조회
    router.get('/stats', (req, res) => controller.getStats(req, res));

    // 최근 인증 시도 목록 조회
    router.get('/attempts', (req, res) => controller.getRecentAttempts(req, res));

    // 특정 사용자의 인증 시도 이력 조회
    router.get('/attempts/:userId', (req, res) => controller.getUserAttempts(req, res));

    // 만료된 인증 시도 정리
    router.delete('/cleanup', (req, res) => controller.cleanupExpiredAttempts(req, res));

    return router;
}
