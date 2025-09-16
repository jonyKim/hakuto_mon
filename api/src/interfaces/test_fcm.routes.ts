/**
 * FCM 테스트 라우트
 * 개발 및 테스트 목적으로만 사용
 */

import { Router } from 'express';
import { TestFCMController, validateTestNotification, validateBroadcastNotification } from './test_fcm.controller';
import { authenticateAdmin, requireAdminGrade } from './auth.middleware';

const router = Router();
const testFCMController = new TestFCMController();

/**
 * @route   POST /api/admin/test/fcm-notification
 * @desc    특정 사용자에게 FCM 테스트 알림 발송
 * @access  Private (Admin)
 */
router.post(
    '/fcm-notification',
    authenticateAdmin,
    requireAdminGrade,
    validateTestNotification,
    testFCMController.sendTestNotification
);

/**
 * @route   POST /api/admin/test/fcm-broadcast
 * @desc    모든 사용자에게 FCM 브로드캐스트 테스트 알림 발송 (주의!)
 * @access  Private (Admin)
 */
router.post(
    '/fcm-broadcast',
    authenticateAdmin,
    requireAdminGrade,
    validateBroadcastNotification,
    testFCMController.sendBroadcastTestNotification
);

export default router;
