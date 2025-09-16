import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { TelegramService } from '../application/telegram.service';
import { TelegramConnectionRepository } from '../infrastructure/repositories/telegram_connection.repository';
import { WalletUserRepository } from '../infrastructure/repositories/wallet_user.repository';

export class TelegramController {
    private telegramService: TelegramService;

    constructor() {
        const telegramRepository = new TelegramConnectionRepository();
        const userRepository = new WalletUserRepository();

        this.telegramService = new TelegramService(
            telegramRepository,
            userRepository
        );
    }

    /**
     * 텔레그램 연결 코드 생성
     */
    generateConnectionCode = async (req: Request, res: Response): Promise<void> => {
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

            const { user_id } = req.body;

            const connectionCode = await this.telegramService.generateConnectionCode(user_id);

            res.status(201).json({
                success: true,
                message: '텔레그램 연결 코드가 생성되었습니다.',
                data: {
                    code: connectionCode.code,
                    expires_at: connectionCode.expiresAt,
                    user_id: connectionCode.userId,
                    instructions: [
                        '1. 텔레그램에서 @HakutoWalletBot을 검색하세요',
                        '2. /start 명령어를 입력하세요',
                        '3. /connect ' + connectionCode.code + ' 명령어를 입력하세요',
                        '4. 연결이 완료되면 알림을 받을 수 있습니다'
                    ]
                }
            });

        } catch (error: any) {
            console.error('Error generating connection code:', error);
            res.status(500).json({
                success: false,
                message: error.message || '연결 코드 생성 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 텔레그램 연결 상태 확인
     */
    getConnectionStatus = async (req: Request, res: Response): Promise<void> => {
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

            const { user_id } = req.params;

            const status = await this.telegramService.getConnectionStatus(user_id);

            res.status(200).json({
                success: true,
                data: {
                    is_connected: status.isConnected,
                    username: status.username,
                    connected_at: status.connectedAt,
                    last_message_at: status.lastMessageAt
                }
            });

        } catch (error) {
            console.error('Error getting connection status:', error);
            res.status(500).json({
                success: false,
                message: '연결 상태 확인 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 텔레그램 연결 해제
     */
    disconnectUser = async (req: Request, res: Response): Promise<void> => {
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

            const { user_id } = req.params;

            await this.telegramService.disconnectUser(user_id);

            res.status(200).json({
                success: true,
                message: '텔레그램 연결이 해제되었습니다.'
            });

        } catch (error) {
            console.error('Error disconnecting user:', error);
            res.status(500).json({
                success: false,
                message: '연결 해제 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 텔레그램 메시지 발송 (내부 API)
     */
    sendMessage = async (req: Request, res: Response): Promise<void> => {
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

            const { user_id, message } = req.body;

            const success = await this.telegramService.sendMessageToUser(user_id, message);

            if (success) {
                res.status(200).json({
                    success: true,
                    message: '텔레그램 메시지가 성공적으로 발송되었습니다.'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: '텔레그램 메시지 발송에 실패했습니다. 연결 상태를 확인해주세요.'
                });
            }

        } catch (error) {
            console.error('Error sending telegram message:', error);
            res.status(500).json({
                success: false,
                message: '메시지 발송 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 텔레그램 일괄 메시지 발송 (내부 API)
     */
    sendBulkMessage = async (req: Request, res: Response): Promise<void> => {
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

            const { user_ids, message } = req.body;

            const result = await this.telegramService.sendBulkMessage(user_ids, message);

            res.status(200).json({
                success: true,
                message: `${result.successful}개의 메시지가 성공적으로 발송되었습니다.`,
                data: {
                    successful: result.successful,
                    failed: result.failed,
                    total: user_ids.length,
                    results: result.results
                }
            });

        } catch (error) {
            console.error('Error sending bulk message:', error);
            res.status(500).json({
                success: false,
                message: '일괄 메시지 발송 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 텔레그램 브로드캐스트 (내부 API)
     */
    broadcastMessage = async (req: Request, res: Response): Promise<void> => {
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

            const { message } = req.body;

            const result = await this.telegramService.broadcastMessage(message);

            res.status(200).json({
                success: true,
                message: `브로드캐스트가 완료되었습니다. ${result.successful}/${result.totalSent} 성공`,
                data: {
                    total_sent: result.totalSent,
                    successful: result.successful,
                    failed: result.failed
                }
            });

        } catch (error) {
            console.error('Error broadcasting message:', error);
            res.status(500).json({
                success: false,
                message: '브로드캐스트 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 텔레그램 연결 통계 조회 (관리자)
     */
    getConnectionStats = async (_req: Request, res: Response): Promise<void> => {
        try {
            const stats = await this.telegramService.getConnectionStats();

            res.status(200).json({
                success: true,
                data: {
                    total_connections: stats.totalConnections,
                    active_connections: stats.activeConnections,
                    pending_codes: stats.pendingCodes,
                    recent_connections: stats.recentConnections.map(connection => ({
                        user_id: connection.userId,
                        username: connection.username,
                        connected_at: connection.connectedAt,
                        last_message_at: connection.lastMessageAt
                    })),
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error getting connection stats:', error);
            res.status(500).json({
                success: false,
                message: '연결 통계 조회 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 텔레그램 봇 웹훅 (내부 API)
     */
    handleWebhook = async (req: Request, res: Response): Promise<void> => {
        try {
            const update = req.body;

            // 텔레그램 업데이트 처리
            if (update.message) {
                const chatId = update.message.chat.id.toString();
                const text = update.message.text;
                const username = update.message.from?.username;

                if (text?.startsWith('/')) {
                    // 명령어 처리
                    const [command, ...args] = text.split(' ');
                    const response = await this.telegramService.handleBotCommand(chatId, command, args);
                    
                    // 응답 메시지 발송 (실제 구현에서는 Telegram Bot API 호출)
                    console.log(`Bot response to ${chatId}: ${response}`);
                }
            }

            res.status(200).json({ success: true });

        } catch (error) {
            console.error('Error handling telegram webhook:', error);
            res.status(500).json({
                success: false,
                message: '웹훅 처리 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 만료된 연결 코드 정리 (내부 API)
     */
    cleanupExpiredCodes = async (_req: Request, res: Response): Promise<void> => {
        try {
            const count = await this.telegramService.cleanupExpiredCodes();

            res.status(200).json({
                success: true,
                message: `${count}개의 만료된 연결 코드가 정리되었습니다.`,
                data: {
                    cleaned_codes: count,
                    cleaned_at: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error cleaning up expired codes:', error);
            res.status(500).json({
                success: false,
                message: '만료된 코드 정리 중 오류가 발생했습니다.'
            });
        }
    };
}

// 유효성 검사 미들웨어들
export const validateGenerateCode = [
    body('user_id')
        .isUUID()
        .withMessage('유효한 사용자 ID를 입력해주세요.')
];

export const validateUserId = [
    param('user_id')
        .isUUID()
        .withMessage('유효한 사용자 ID를 입력해주세요.')
];

export const validateSendMessage = [
    body('user_id')
        .isUUID()
        .withMessage('유효한 사용자 ID를 입력해주세요.'),
    body('message')
        .notEmpty()
        .withMessage('메시지 내용은 필수입니다.')
        .isLength({ min: 1, max: 4096 })
        .withMessage('메시지는 1-4096자 사이여야 합니다.')
];

export const validateBulkMessage = [
    body('user_ids')
        .isArray({ min: 1 })
        .withMessage('최소 하나의 사용자 ID가 필요합니다.'),
    body('user_ids.*')
        .isUUID()
        .withMessage('유효한 사용자 ID를 입력해주세요.'),
    body('message')
        .notEmpty()
        .withMessage('메시지 내용은 필수입니다.')
        .isLength({ min: 1, max: 4096 })
        .withMessage('메시지는 1-4096자 사이여야 합니다.')
];

export const validateBroadcast = [
    body('message')
        .notEmpty()
        .withMessage('메시지 내용은 필수입니다.')
        .isLength({ min: 1, max: 4096 })
        .withMessage('메시지는 1-4096자 사이여야 합니다.')
];
