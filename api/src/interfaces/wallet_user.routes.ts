import { Router } from 'express';
import { 
    WalletUserController,
    validateUserRegistration,
    validateUserUpdate,
    validateUserId,
    validateWalletAddress,
    validateEmailSearch,
    validatePagination,
    validateFCMTokenUpdate,
    validateMyFCMTokenUpdate
} from './wallet_user.controller';

const router = Router();
const walletUserController = new WalletUserController();

// === 사용자 등록 & 조회 ===
// 지갑 사용자 등록
router.post('/register', validateUserRegistration, walletUserController.registerWalletUser);

// 모든 사용자 조회 (관리자용) - 페이지네이션 포함
router.get('/', validatePagination, walletUserController.getAllWalletUsers);

// 사용자 통계 조회
router.get('/stats', walletUserController.getUserStats);

// 이메일로 사용자 검색
router.get('/search/email', validateEmailSearch, walletUserController.searchUsersByEmail);

// === CRUD 작업 (ID 기반) ===
// ID로 사용자 조회
router.get('/id/:id', validateUserId, walletUserController.getUserById);

// 사용자 정보 업데이트
router.put('/id/:id', validateUserUpdate, walletUserController.updateUser);

// 사용자 삭제
router.delete('/id/:id', validateUserId, walletUserController.deleteUser);

// === 지갑 주소 기반 조회 (기존 호환성) ===
// 지갑 주소로 사용자 조회
router.get('/wallet/:wallet_address', validateWalletAddress, walletUserController.getWalletUser);

// === FCM 토큰 관리 ===
// 지갑 주소로 FCM 토큰 업데이트 (앱 시작 시 사용)
router.put('/fcm-token', validateFCMTokenUpdate, walletUserController.updateFCMToken);

// 사용자 ID로 FCM 토큰 업데이트 (인증된 사용자용)
router.put('/id/:id/fcm-token', validateMyFCMTokenUpdate, walletUserController.updateMyFCMToken);

export default router; 