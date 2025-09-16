import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { WalletUserRepository } from '../infrastructure/repositories/wallet_user.repository';
import { FirebaseService } from '../application/firebase.service';

export class FCMController {
    private walletUserRepository: WalletUserRepository;
    private firebaseService: FirebaseService;

    constructor() {
        this.walletUserRepository = new WalletUserRepository();
        
        // Firebase 서비스 초기화
        this.firebaseService = new FirebaseService({
            projectId: process.env.FIREBASE_PROJECT_ID!,
            privateKey: process.env.FIREBASE_PRIVATE_KEY!,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL!
        });
        this.firebaseService.initialize();
    }

    /**
     * FCM 토큰 등록/업데이트
     * POST /api/fcm/register
     */
    registerToken = async (req: Request, res: Response): Promise<void> => {
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

            const { 
                wallet_address, 
                fcm_token, 
                device_info,
                app_version 
            } = req.body;

            console.log('[FCMController] FCM 토큰 등록 요청:', {
                wallet_address,
                fcm_token: fcm_token.substring(0, 20) + '...',
                device_info,
                app_version
            });

            // 1. FCM 토큰 유효성 검증
            const isValidToken = await this.firebaseService.validateToken(fcm_token);
            if (!isValidToken) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 FCM 토큰입니다.'
                });
                return;
            }

            // 2. 지갑 주소로 사용자 조회
            let user = await this.walletUserRepository.findByWalletAddress(wallet_address);
            
            if (!user) {
                // 3. 사용자가 없으면 새로 생성
                const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                user = await this.walletUserRepository.create({
                    id: userId,
                    walletAddress: wallet_address,
                    fcmToken: fcm_token,
                    emailVerified: false
                });

                console.log('[FCMController] 새 사용자 생성:', userId);
            } else {
                // 4. 기존 사용자의 FCM 토큰 업데이트
                await this.walletUserRepository.updateFcmToken(user.id, fcm_token);
                console.log('[FCMController] FCM 토큰 업데이트:', user.id);
            }

            // 5. 디바이스 정보 메타데이터 업데이트 (선택사항)
            if (device_info || app_version) {
                const metadata = {
                    device_info,
                    app_version,
                    last_fcm_update: new Date().toISOString()
                };
                
                // 메타데이터 저장 로직 (필요시 구현)
                console.log('[FCMController] 디바이스 메타데이터:', metadata);
            }

            // 6. 기본 토픽 구독 (선택사항)
            try {
                await this.firebaseService.subscribeToTopic([fcm_token], 'all_users');
                console.log('[FCMController] 기본 토픽 구독 완료: all_users');
            } catch (error) {
                console.warn('[FCMController] 토픽 구독 실패:', error);
                // 토픽 구독 실패는 치명적이지 않으므로 계속 진행
            }

            res.status(200).json({
                success: true,
                message: 'FCM 토큰이 성공적으로 등록되었습니다.',
                data: {
                    user_id: user.id,
                    wallet_address: user.walletAddress,
                    fcm_registered: true,
                    subscribed_topics: ['all_users']
                }
            });

        } catch (error: any) {
            console.error('[FCMController] FCM 토큰 등록 실패:', error);
            res.status(500).json({
                success: false,
                message: 'FCM 토큰 등록 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    };

    /**
     * FCM 토큰 해제
     * DELETE /api/fcm/unregister
     */
    unregisterToken = async (req: Request, res: Response): Promise<void> => {
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

            const { wallet_address, fcm_token } = req.body;

            console.log('[FCMController] FCM 토큰 해제 요청:', {
                wallet_address,
                fcm_token: fcm_token?.substring(0, 20) + '...'
            });

            // 1. 사용자 조회
            const user = await this.walletUserRepository.findByWalletAddress(wallet_address);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
                return;
            }

            // 2. FCM 토큰 제거
            await this.walletUserRepository.updateFcmToken(user.id, '');

            // 3. 토픽 구독 해제 (선택사항)
            if (fcm_token) {
                try {
                    await this.firebaseService.unsubscribeFromTopic([fcm_token], 'all_users');
                    console.log('[FCMController] 토픽 구독 해제 완료');
                } catch (error) {
                    console.warn('[FCMController] 토픽 구독 해제 실패:', error);
                }
            }

            res.status(200).json({
                success: true,
                message: 'FCM 토큰이 성공적으로 해제되었습니다.',
                data: {
                    user_id: user.id,
                    wallet_address: user.walletAddress,
                    fcm_registered: false
                }
            });

        } catch (error: any) {
            console.error('[FCMController] FCM 토큰 해제 실패:', error);
            res.status(500).json({
                success: false,
                message: 'FCM 토큰 해제 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    };

    /**
     * FCM 토큰 상태 확인
     * GET /api/fcm/status/:wallet_address
     */
    getTokenStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const { wallet_address } = req.params;

            console.log('[FCMController] FCM 토큰 상태 조회:', wallet_address);

            // 1. 사용자 조회
            const user = await this.walletUserRepository.findByWalletAddress(wallet_address);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
                return;
            }

            // 2. FCM 토큰 유효성 확인
            let isValidToken = false;
            if (user.fcmToken) {
                isValidToken = await this.firebaseService.validateToken(user.fcmToken);
            }

            res.status(200).json({
                success: true,
                data: {
                    user_id: user.id,
                    wallet_address: user.walletAddress,
                    has_fcm_token: !!user.fcmToken,
                    is_token_valid: isValidToken,
                    last_updated: user.updatedAt
                }
            });

        } catch (error: any) {
            console.error('[FCMController] FCM 토큰 상태 조회 실패:', error);
            res.status(500).json({
                success: false,
                message: 'FCM 토큰 상태 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    };

    /**
     * 테스트 알림 발송
     * POST /api/fcm/test-notification
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

            const { wallet_address, message } = req.body;

            console.log('[FCMController] 테스트 알림 발송:', wallet_address);

            // 1. 사용자 조회
            const user = await this.walletUserRepository.findByWalletAddress(wallet_address);
            if (!user || !user.fcmToken) {
                res.status(404).json({
                    success: false,
                    message: 'FCM 토큰이 등록되지 않은 사용자입니다.'
                });
                return;
            }

            // 2. 테스트 알림 발송
            const result = await this.firebaseService.sendToDevice(user.fcmToken, {
                title: '🧪 HAKUTO MON 테스트 알림',
                body: message || 'FCM 푸시 알림 테스트입니다!',
                data: {
                    type: 'test',
                    timestamp: new Date().toISOString(),
                    user_id: user.id
                }
            });

            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: '테스트 알림이 성공적으로 발송되었습니다.',
                    data: {
                        message_id: result.messageId,
                        user_id: user.id,
                        wallet_address: user.walletAddress
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: '테스트 알림 발송에 실패했습니다.',
                    error: result.error
                });
            }

        } catch (error: any) {
            console.error('[FCMController] 테스트 알림 발송 실패:', error);
            res.status(500).json({
                success: false,
                message: '테스트 알림 발송 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    };
}

// 유효성 검사 미들웨어
export const validateRegisterToken = [
    body('wallet_address')
        .notEmpty()
        .withMessage('지갑 주소는 필수입니다.')
        .isLength({ min: 42, max: 42 })
        .withMessage('유효한 지갑 주소를 입력해주세요.'),
    body('fcm_token')
        .notEmpty()
        .withMessage('FCM 토큰은 필수입니다.')
        .isLength({ min: 10 })
        .withMessage('유효한 FCM 토큰을 입력해주세요.'),
    body('device_info')
        .optional()
        .isObject()
        .withMessage('디바이스 정보는 객체 형태여야 합니다.'),
    body('app_version')
        .optional()
        .isString()
        .withMessage('앱 버전은 문자열이어야 합니다.')
];

export const validateUnregisterToken = [
    body('wallet_address')
        .notEmpty()
        .withMessage('지갑 주소는 필수입니다.')
        .isLength({ min: 42, max: 42 })
        .withMessage('유효한 지갑 주소를 입력해주세요.'),
    body('fcm_token')
        .optional()
        .isString()
        .withMessage('FCM 토큰은 문자열이어야 합니다.')
];

export const validateTestNotification = [
    body('wallet_address')
        .notEmpty()
        .withMessage('지갑 주소는 필수입니다.')
        .isLength({ min: 42, max: 42 })
        .withMessage('유효한 지갑 주소를 입력해주세요.'),
    body('message')
        .optional()
        .isString()
        .isLength({ max: 200 })
        .withMessage('메시지는 200자 이하여야 합니다.')
];
