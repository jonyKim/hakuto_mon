import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticateJwt, requireAdmin } from './auth.middleware';

const router = Router();
const usersController = new UsersController();

// 모든 라우트에 인증과 관리자 권한 필요
router.use(authenticateJwt, requireAdmin);

// 유저 목록 조회
router.get('/', usersController.getUsers);

// 유저 상태 업데이트
router.patch('/:userId/status', usersController.updateUserStatus);

// 유저 삭제 (비활성화)
router.delete('/:userId', usersController.deleteUser);

export default router; 