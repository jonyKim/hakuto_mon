import { Router } from 'express';
import { AdminWalletUserController } from './admin_wallet_user.controller';
import { createAuthMiddleware, createAdminMiddleware } from '../middleware/auth';
import { JwtService } from '../application/jwt.service';

export function createAdminWalletUserRouter(adminWalletUserController: AdminWalletUserController) {
    const router = Router();
    const jwtService = new JwtService();

    // 어드민 인증 미들웨어 적용
    router.use(createAuthMiddleware(jwtService), createAdminMiddleware());

    // === 어드민 전용 Wallet Users API ===
    
    // 모든 지갑 사용자 목록 조회 (페이지네이션)
    router.get('/', adminWalletUserController.getAllWalletUsers);
    
    // 사용자 통계 조회
    router.get('/stats', adminWalletUserController.getUserStats);
    
    // ID로 사용자 상세 조회
    router.get('/:id', adminWalletUserController.getUserById);
    
    // 지갑 주소로 사용자 조회
    router.get('/wallet/:wallet_address', adminWalletUserController.getUserByWalletAddress);
    
    // 이메일로 사용자 검색
    router.get('/search/email', adminWalletUserController.searchUsersByEmail);
    
    // 사용자 정보 업데이트
    router.put('/:id', adminWalletUserController.updateUser);
    
    // 사용자 삭제
    router.delete('/:id', adminWalletUserController.deleteUser);

    return router;
}
