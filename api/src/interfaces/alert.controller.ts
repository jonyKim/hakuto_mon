import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AlertService } from '../application/alert.service';
import { NotificationService } from '../application/notification.service';
import { TelegramService } from '../application/telegram.service';
import { AlertRuleRepository } from '../infrastructure/repositories/alert_rule.repository';
import { NotificationHistoryRepository } from '../infrastructure/repositories/notification_history.repository';
import { PortfolioRepository } from '../infrastructure/repositories/portfolio.repository';
import { EventRepository } from '../infrastructure/repositories/event.repository';
import { TelegramConnectionRepository } from '../infrastructure/repositories/telegram_connection.repository';
import { WalletUserRepository } from '../infrastructure/repositories/wallet_user.repository';
import { FirebaseService } from '../application/firebase.service';
import { EmailService } from '../application/email.service';

export class AlertController {
    private alertService: AlertService;

    constructor() {
        // 의존성 주입
        const alertRepository = new AlertRuleRepository();
        const notificationHistoryRepository = new NotificationHistoryRepository();
        const portfolioRepository = new PortfolioRepository();
        const eventRepository = new EventRepository();
        const telegramRepository = new TelegramConnectionRepository();
        const userRepository = new WalletUserRepository();
        
        const firebaseService = new FirebaseService();
        const emailService = new EmailService();
        const notificationService = new NotificationService(
            firebaseService,
            emailService,
            notificationHistoryRepository as any, // 기존 타입과 호환
            userRepository
        );
        const telegramService = new TelegramService(telegramRepository, userRepository);

        this.alertService = new AlertService(
            alertRepository,
            notificationHistoryRepository,
            portfolioRepository,
            eventRepository,
            telegramRepository,
            userRepository,
            notificationService,
            telegramService
        );
    }

    /**
     * 알림 규칙 생성
     */
    createAlert = async (req: Request, res: Response): Promise<void> => {
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
                user_id,
                type,
                name,
                asset_symbol,
                conditions,
                channels,
                frequency,
                memo
            } = req.body;

            const alertRule = await this.alertService.createAlert({
                userId: user_id,
                type,
                name,
                assetSymbol: asset_symbol,
                conditions,
                channels,
                frequency,
                memo
            });

            res.status(201).json({
                success: true,
                message: '알림 규칙이 성공적으로 생성되었습니다.',
                data: {
                    id: alertRule.id,
                    user_id: alertRule.userId,
                    type: alertRule.type,
                    name: alertRule.name,
                    asset_symbol: alertRule.assetSymbol,
                    conditions: alertRule.conditions,
                    channels: alertRule.channels,
                    frequency: alertRule.frequency,
                    is_active: alertRule.isActive,
                    status: alertRule.status,
                    memo: alertRule.memo,
                    created_at: alertRule.createdAt
                }
            });

        } catch (error: any) {
            console.error('Error creating alert:', error);
            res.status(500).json({
                success: false,
                message: error.message || '알림 규칙 생성 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 알림 규칙 목록 조회
     */
    getAlerts = async (req: Request, res: Response): Promise<void> => {
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

            const { user_id, type, status } = req.query;

            const alerts = await this.alertService.getAlerts(
                user_id as string,
                type as string,
                status as string
            );

            res.status(200).json({
                success: true,
                data: alerts.map(alert => ({
                    id: alert.id,
                    user_id: alert.userId,
                    type: alert.type,
                    name: alert.name,
                    asset_symbol: alert.assetSymbol,
                    conditions: alert.conditions,
                    channels: alert.channels,
                    frequency: alert.frequency,
                    is_active: alert.isActive,
                    status: alert.status,
                    triggered_count: alert.triggeredCount,
                    last_triggered_at: alert.lastTriggeredAt,
                    memo: alert.memo,
                    created_at: alert.createdAt,
                    updated_at: alert.updatedAt
                }))
            });

        } catch (error) {
            console.error('Error getting alerts:', error);
            res.status(500).json({
                success: false,
                message: '알림 규칙 조회 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 알림 규칙 상세 조회
     */
    getAlert = async (req: Request, res: Response): Promise<void> => {
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

            const { alert_id } = req.params;

            const alert = await this.alertService.getAlert(alert_id);
            if (!alert) {
                res.status(404).json({
                    success: false,
                    message: '알림 규칙을 찾을 수 없습니다.'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    id: alert.id,
                    user_id: alert.userId,
                    type: alert.type,
                    name: alert.name,
                    asset_symbol: alert.assetSymbol,
                    conditions: alert.conditions,
                    channels: alert.channels,
                    frequency: alert.frequency,
                    is_active: alert.isActive,
                    status: alert.status,
                    triggered_count: alert.triggeredCount,
                    last_triggered_at: alert.lastTriggeredAt,
                    memo: alert.memo,
                    created_at: alert.createdAt,
                    updated_at: alert.updatedAt
                }
            });

        } catch (error) {
            console.error('Error getting alert:', error);
            res.status(500).json({
                success: false,
                message: '알림 규칙 조회 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 알림 규칙 수정
     */
    updateAlert = async (req: Request, res: Response): Promise<void> => {
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

            const { alert_id } = req.params;
            const {
                name,
                conditions,
                channels,
                frequency,
                is_active,
                status,
                memo
            } = req.body;

            const updatedAlert = await this.alertService.updateAlert({
                id: alert_id,
                name,
                conditions,
                channels,
                frequency,
                isActive: is_active,
                status,
                memo
            });

            if (!updatedAlert) {
                res.status(404).json({
                    success: false,
                    message: '알림 규칙을 찾을 수 없습니다.'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: '알림 규칙이 성공적으로 수정되었습니다.',
                data: {
                    id: updatedAlert.id,
                    user_id: updatedAlert.userId,
                    type: updatedAlert.type,
                    name: updatedAlert.name,
                    asset_symbol: updatedAlert.assetSymbol,
                    conditions: updatedAlert.conditions,
                    channels: updatedAlert.channels,
                    frequency: updatedAlert.frequency,
                    is_active: updatedAlert.isActive,
                    status: updatedAlert.status,
                    triggered_count: updatedAlert.triggeredCount,
                    last_triggered_at: updatedAlert.lastTriggeredAt,
                    memo: updatedAlert.memo,
                    updated_at: updatedAlert.updatedAt
                }
            });

        } catch (error: any) {
            console.error('Error updating alert:', error);
            res.status(500).json({
                success: false,
                message: error.message || '알림 규칙 수정 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 알림 규칙 삭제
     */
    deleteAlert = async (req: Request, res: Response): Promise<void> => {
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

            const { alert_id } = req.params;

            await this.alertService.deleteAlert(alert_id);

            res.status(200).json({
                success: true,
                message: '알림 규칙이 성공적으로 삭제되었습니다.'
            });

        } catch (error: any) {
            console.error('Error deleting alert:', error);
            
            if (error.message.includes('찾을 수 없습니다')) {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: '알림 규칙 삭제 중 오류가 발생했습니다.'
                });
            }
        }
    };

    /**
     * 테스트 알림 발송
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

            const { alert_id } = req.params;

            await this.alertService.sendTestNotification(alert_id);

            res.status(200).json({
                success: true,
                message: '테스트 알림이 성공적으로 발송되었습니다.'
            });

        } catch (error: any) {
            console.error('Error sending test notification:', error);
            
            if (error.message.includes('찾을 수 없습니다')) {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: '테스트 알림 발송 중 오류가 발생했습니다.'
                });
            }
        }
    };

    /**
     * 알림 통계 조회
     */
    getAlertStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const { user_id } = req.query;

            const stats = await this.alertService.getAlertStats(user_id as string);

            res.status(200).json({
                success: true,
                data: {
                    ...stats,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error getting alert stats:', error);
            res.status(500).json({
                success: false,
                message: '알림 통계 조회 중 오류가 발생했습니다.'
            });
        }
    };
}

// 유효성 검사 미들웨어들
export const validateCreateAlert = [
    body('user_id')
        .isUUID()
        .withMessage('유효한 사용자 ID를 입력해주세요.'),
    body('type')
        .isIn(['price_target', 'event', 'portfolio'])
        .withMessage('유효한 알림 유형을 선택해주세요.'),
    body('name')
        .notEmpty()
        .withMessage('알림 이름은 필수입니다.')
        .isLength({ min: 1, max: 255 })
        .withMessage('알림 이름은 1-255자 사이여야 합니다.'),
    body('asset_symbol')
        .optional()
        .isLength({ min: 1, max: 20 })
        .withMessage('자산 심볼은 1-20자 사이여야 합니다.'),
    body('conditions')
        .isArray({ min: 1 })
        .withMessage('최소 하나의 조건이 필요합니다.'),
    body('channels')
        .isArray({ min: 1 })
        .withMessage('최소 하나의 알림 채널이 필요합니다.'),
    body('frequency')
        .optional()
        .isIn(['immediate', '5min', '1hour', 'daily'])
        .withMessage('유효한 빈도를 선택해주세요.')
];

export const validateUpdateAlert = [
    param('alert_id')
        .isUUID()
        .withMessage('유효한 알림 ID를 입력해주세요.'),
    body('name')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('알림 이름은 1-255자 사이여야 합니다.'),
    body('conditions')
        .optional()
        .isArray({ min: 1 })
        .withMessage('최소 하나의 조건이 필요합니다.'),
    body('channels')
        .optional()
        .isArray({ min: 1 })
        .withMessage('최소 하나의 알림 채널이 필요합니다.'),
    body('frequency')
        .optional()
        .isIn(['immediate', '5min', '1hour', 'daily'])
        .withMessage('유효한 빈도를 선택해주세요.'),
    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('활성 상태는 boolean 값이어야 합니다.'),
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'paused'])
        .withMessage('유효한 상태를 선택해주세요.')
];

export const validateAlertId = [
    param('alert_id')
        .isUUID()
        .withMessage('유효한 알림 ID를 입력해주세요.')
];

export const validateGetAlerts = [
    query('user_id')
        .isUUID()
        .withMessage('유효한 사용자 ID를 입력해주세요.'),
    query('type')
        .optional()
        .isIn(['price_target', 'event', 'portfolio'])
        .withMessage('유효한 알림 유형을 선택해주세요.'),
    query('status')
        .optional()
        .isIn(['active', 'inactive', 'paused'])
        .withMessage('유효한 상태를 선택해주세요.')
];

export const validateAlertStats = [
    query('user_id')
        .optional()
        .isUUID()
        .withMessage('유효한 사용자 ID를 입력해주세요.')
];
