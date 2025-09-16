/**
 * FCM 테스트용 컨트롤러
 * 개발 및 테스트 목적으로만 사용
 */

import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { NotificationService } from '../application/notification.service';
import { WalletUserRepository } from '../infrastructure/repositories/wallet_user.repository';
import { NotificationHistoryRepository } from '../infrastructure/repositories/notification_history.repository';
import { FirebaseService } from '../application/firebase.service';

export class TestFCMController {
    private notificationService: NotificationService;
    private walletUserRepository: WalletUserRepository;

    constructor() {
        // 의존성 주입 (실제 구현에서는 DI 컨테이너 사용)
        const firebaseService = new FirebaseService({
            projectId: process.env.FIREBASE_PROJECT_ID!,
            privateKey: process.env.FIREBASE_PRIVATE_KEY!,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        });
        firebaseService.initialize();

        const notificationHistoryRepository = new NotificationHistoryRepository();
        this.walletUserRepository = new WalletUserRepository();
        
        this.notificationService = new NotificationService(
            firebaseService,
            null, // emailService는 테스트에서 불필요
            notificationHistoryRepository,
            this.walletUserRepository
        );
    }

    /**
     * FCM 테스트 알림 발송
     */
    sendTestNotification = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { user_id, title, message, data } = req.body;

            console.log(`[TestFCM] 테스트 알림 발송 시작 - User: ${user_id}`);

            // 사용자 존재 확인
            const user = await this.walletUserRepository.findById(user_id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
                return;
            }

            if (!user.fcmToken) {
                res.status(400).json({
                    success: false,
                    message: '사용자의 FCM 토큰이 등록되지 않았습니다.'
                });
                return;
            }

            // FCM 알림 발송
            const result = await this.notificationService.sendAlert({
                userId: user_id,
                title,
                message,
                data: {
                    type: 'test',
                    timestamp: new Date().toISOString(),
                    ...data
                },
                preferredType: 'push'
            });

            console.log(`[TestFCM] 알림 발송 결과:`, result);

            res.status(200).json({
                success: true,
                message: 'FCM 테스트 알림이 발송되었습니다.',
                data: {
                    user_id,
                    fcm_token: user.fcmToken.substring(0, 20) + '...', // 보안상 일부만 표시
                    result
                }
            });

        } catch (error: any) {
            console.error('[TestFCM] 테스트 알림 발송 실패:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'FCM 테스트 알림 발송 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 모든 등록된 사용자에게 테스트 알림 발송 (주의: 실제 사용자에게 발송됨)
     */
    sendBroadcastTestNotification = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { title, message, data } = req.body;

            console.log(`[TestFCM] 브로드캐스트 테스트 알림 발송 시작`);

            // FCM 토큰이 있는 모든 사용자 조회
            const users = await this.walletUserRepository.findUsersWithFCMToken();
            
            if (users.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'FCM 토큰이 등록된 사용자가 없습니다.'
                });
                return;
            }

            const results = [];
            for (const user of users) {
                try {
                    const result = await this.notificationService.sendAlert({
                        userId: user.id,
                        title,
                        message,
                        data: {
                            type: 'broadcast_test',
                            timestamp: new Date().toISOString(),
                            ...data
                        },
                        preferredType: 'push'
                    });
                    results.push({ userId: user.id, success: true, result });
                } catch (error) {
                    results.push({ userId: user.id, success: false, error: error.message });
                }
            }

            console.log(`[TestFCM] 브로드캐스트 발송 완료 - 총 ${users.length}명`);

            res.status(200).json({
                success: true,
                message: `브로드캐스트 테스트 알림이 ${users.length}명에게 발송되었습니다.`,
                data: {
                    total_users: users.length,
                    results
                }
            });

        } catch (error: any) {
            console.error('[TestFCM] 브로드캐스트 테스트 알림 발송 실패:', error);
            res.status(500).json({
                success: false,
                message: error.message || '브로드캐스트 테스트 알림 발송 중 오류가 발생했습니다.'
            });
        }
    };
}

// 유효성 검사 미들웨어
export const validateTestNotification = [
    body('user_id')
        .notEmpty()
        .withMessage('사용자 ID는 필수입니다.')
        .isUUID()
        .withMessage('유효한 사용자 ID를 입력해주세요.'),
    body('title')
        .notEmpty()
        .withMessage('알림 제목은 필수입니다.')
        .isLength({ min: 1, max: 100 })
        .withMessage('알림 제목은 1-100자 사이여야 합니다.'),
    body('message')
        .notEmpty()
        .withMessage('알림 메시지는 필수입니다.')
        .isLength({ min: 1, max: 500 })
        .withMessage('알림 메시지는 1-500자 사이여야 합니다.'),
    body('data')
        .optional()
        .isObject()
        .withMessage('데이터는 객체 형태여야 합니다.')
];

export const validateBroadcastNotification = [
    body('title')
        .notEmpty()
        .withMessage('알림 제목은 필수입니다.')
        .isLength({ min: 1, max: 100 })
        .withMessage('알림 제목은 1-100자 사이여야 합니다.'),
    body('message')
        .notEmpty()
        .withMessage('알림 메시지는 필수입니다.')
        .isLength({ min: 1, max: 500 })
        .withMessage('알림 메시지는 1-500자 사이여야 합니다.'),
    body('data')
        .optional()
        .isObject()
        .withMessage('데이터는 객체 형태여야 합니다.')
];
