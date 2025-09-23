import { TelegramConnectionRepository } from '../infrastructure/repositories/telegram_connection.repository';
import { WalletUserRepository } from '../infrastructure/repositories/wallet_user.repository';
import { TelegramConnection } from '../domain/entities/telegram_connection.entity';

export interface TelegramConnectionCode {
    code: string;
    expiresAt: Date;
    userId: string;
}

export interface TelegramStatus {
    isConnected: boolean;
    username?: string;
    connectedAt?: Date;
    lastMessageAt?: Date;
}

export interface TelegramStats {
    totalConnections: number;
    activeConnections: number;
    pendingCodes: number;
    recentConnections: TelegramConnection[];
}

export class TelegramService {
    private telegramRepository: TelegramConnectionRepository;
    private userRepository: WalletUserRepository;

    constructor(
        telegramRepository: TelegramConnectionRepository,
        userRepository: WalletUserRepository
    ) {
        this.telegramRepository = telegramRepository;
        this.userRepository = userRepository;
    }

    /**
     * 텔레그램 연결 코드 생성
     */
    async generateConnectionCode(userId: string): Promise<TelegramConnectionCode> {
        try {
            // 사용자 존재 확인
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            // 6자리 랜덤 코드 생성
            const code = this.generateRandomCode();
            
            // 15분 후 만료
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 15);

            // 연결 코드 저장
            await this.telegramRepository.setConnectionCode(userId, code, expiresAt);

            console.log(`Telegram connection code generated for user: ${userId}`);

            return {
                code,
                expiresAt,
                userId
            };

        } catch (error) {
            console.error('Error generating connection code:', error);
            throw error;
        }
    }

    /**
     * 텔레그램 연결 상태 확인
     */
    async getConnectionStatus(userId: string): Promise<TelegramStatus> {
        try {
            const connection = await this.telegramRepository.findByUserId(userId);

            if (!connection || !connection.isActive) {
                return {
                    isConnected: false
                };
            }

            return {
                isConnected: true,
                username: connection.username,
                connectedAt: connection.connectedAt,
                lastMessageAt: connection.lastMessageAt
            };

        } catch (error) {
            console.error('Error getting connection status:', error);
            throw error;
        }
    }

    /**
     * 텔레그램 연결 (봇에서 호출)
     */
    async connectUser(code: string, chatId: string, username?: string): Promise<TelegramConnection | null> {
        try {
            const connection = await this.telegramRepository.connectUser(code, chatId, username);

            if (connection) {
                console.log(`Telegram user connected: ${connection.userId} - ${username || chatId}`);
            }

            return connection;

        } catch (error) {
            console.error('Error connecting telegram user:', error);
            throw error;
        }
    }

    /**
     * 텔레그램 연결 해제
     */
    async disconnectUser(userId: string): Promise<void> {
        try {
            await this.telegramRepository.disconnect(userId);
            console.log(`Telegram user disconnected: ${userId}`);

        } catch (error) {
            console.error('Error disconnecting telegram user:', error);
            throw error;
        }
    }

    /**
     * 텔레그램 메시지 발송
     */
    async sendMessage(chatId: string, message: string): Promise<boolean> {
        try {
            // 실제 구현에서는 Telegram Bot API 호출
            // 여기서는 임시로 성공 반환
            console.log(`Telegram message sent to ${chatId}: ${message}`);
            
            // 마지막 메시지 시간 업데이트
            await this.telegramRepository.updateLastMessageTime(chatId);
            
            return true;

        } catch (error) {
            console.error('Error sending telegram message:', error);
            return false;
        }
    }

    /**
     * 텔레그램 메시지 발송 (사용자 ID로)
     */
    async sendMessageToUser(userId: string, message: string): Promise<boolean> {
        try {
            const connection = await this.telegramRepository.findByUserId(userId);
            
            if (!connection || !connection.isActive) {
                console.warn(`No active telegram connection for user: ${userId}`);
                return false;
            }

            return await this.sendMessage(connection.chatId, message);

        } catch (error) {
            console.error('Error sending message to user:', error);
            return false;
        }
    }

    /**
     * 여러 사용자에게 메시지 발송
     */
    async sendBulkMessage(userIds: string[], message: string): Promise<{
        successful: number;
        failed: number;
        results: { userId: string; success: boolean }[];
    }> {
        const results: { userId: string; success: boolean }[] = [];
        let successful = 0;
        let failed = 0;

        for (const userId of userIds) {
            try {
                const success = await this.sendMessageToUser(userId, message);
                results.push({ userId, success });
                
                if (success) {
                    successful++;
                } else {
                    failed++;
                }
            } catch (error) {
                console.error(`Error sending message to user ${userId}:`, error);
                results.push({ userId, success: false });
                failed++;
            }
        }

        return {
            successful,
            failed,
            results
        };
    }

    /**
     * 활성 연결된 모든 사용자에게 메시지 발송
     */
    async broadcastMessage(message: string): Promise<{
        totalSent: number;
        successful: number;
        failed: number;
    }> {
        try {
            const activeConnections = await this.telegramRepository.findActiveConnections();
            let successful = 0;
            let failed = 0;

            for (const connection of activeConnections) {
                try {
                    const success = await this.sendMessage(connection.chatId, message);
                    if (success) {
                        successful++;
                    } else {
                        failed++;
                    }
                } catch (error) {
                    console.error(`Error broadcasting to ${connection.chatId}:`, error);
                    failed++;
                }
            }

            console.log(`Broadcast completed: ${successful} successful, ${failed} failed`);

            return {
                totalSent: activeConnections.length,
                successful,
                failed
            };

        } catch (error) {
            console.error('Error broadcasting message:', error);
            throw error;
        }
    }

    /**
     * 만료된 연결 코드 정리
     */
    async cleanupExpiredCodes(): Promise<number> {
        try {
            const expiredConnections = await this.telegramRepository.findExpiredCodes();
            
            for (const connection of expiredConnections) {
                await this.telegramRepository.update(connection.id, {
                    connectionCode: undefined,
                    codeExpiresAt: undefined
                });
            }

            console.log(`Cleaned up ${expiredConnections.length} expired codes`);
            return expiredConnections.length;

        } catch (error) {
            console.error('Error cleaning up expired codes:', error);
            return 0;
        }
    }

    /**
     * 텔레그램 연결 통계 조회
     */
    async getConnectionStats(): Promise<TelegramStats> {
        try {
            return await this.telegramRepository.getConnectionStats();
        } catch (error) {
            console.error('Error getting connection stats:', error);
            throw error;
        }
    }

    /**
     * 사용자별 텔레그램 연결 정보 조회
     */
    async getUserConnection(userId: string): Promise<TelegramConnection | null> {
        try {
            return await this.telegramRepository.findByUserId(userId);
        } catch (error) {
            console.error('Error getting user connection:', error);
            throw error;
        }
    }

    /**
     * 채팅 ID로 연결 정보 조회
     */
    async getConnectionByChatId(chatId: string): Promise<TelegramConnection | null> {
        try {
            return await this.telegramRepository.findByChatId(chatId);
        } catch (error) {
            console.error('Error getting connection by chat ID:', error);
            throw error;
        }
    }

    /**
     * 텔레그램 봇 명령어 처리
     */
    async handleBotCommand(chatId: string, command: string, args?: string[]): Promise<string> {
        try {
            switch (command) {
                case '/start':
                    return this.handleStartCommand();
                
                case '/connect':
                    if (args && args.length > 0) {
                        return await this.handleConnectCommand(chatId, args[0]);
                    }
                    return '연결 코드를 입력해주세요. 예: /connect ABC123';
                
                case '/status':
                    return await this.handleStatusCommand(chatId);
                
                case '/disconnect':
                    return await this.handleDisconnectCommand(chatId);
                
                case '/help':
                    return this.handleHelpCommand();
                
                default:
                    return '알 수 없는 명령어입니다. /help를 입력하여 사용 가능한 명령어를 확인하세요.';
            }

        } catch (error) {
            console.error('Error handling bot command:', error);
            return '명령어 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
    }

    /**
     * /start 명령어 처리
     */
    private handleStartCommand(): string {
        return `🚀 하쿠토 월렛 알림 봇에 오신 것을 환영합니다!

연결하려면 다음 단계를 따라주세요:
1. 하쿠토 월렛 앱을 열어주세요
2. 설정 > 알림 > 텔레그램 연결로 이동
3. 연결 코드를 생성하세요
4. 생성된 코드를 다음과 같이 입력하세요:
   /connect YOUR_CODE

도움이 필요하시면 /help를 입력하세요.`;
    }

    /**
     * /connect 명령어 처리
     */
    private async handleConnectCommand(chatId: string, code: string): Promise<string> {
        try {
            const connection = await this.connectUser(code, chatId);
            
            if (connection) {
                return `✅ 연결 완료!

하쿠토 월렛과 성공적으로 연결되었습니다.
이제 다음과 같은 알림을 받을 수 있습니다:
• 가격 알림
• 포트폴리오 변동 알림
• 이벤트 알림

연결 상태를 확인하려면 /status를 입력하세요.`;
            } else {
                return `❌ 연결 실패

유효하지 않거나 만료된 연결 코드입니다.
하쿠토 월렛 앱에서 새로운 코드를 생성해주세요.`;
            }

        } catch (error) {
            return `⚠️ 연결 중 오류가 발생했습니다.

잠시 후 다시 시도해주세요.
문제가 계속되면 고객지원팀에 문의하세요.`;
        }
    }

    /**
     * /status 명령어 처리
     */
    private async handleStatusCommand(chatId: string): Promise<string> {
        try {
            const connection = await this.telegramRepository.findByChatId(chatId);
            
            if (!connection || !connection.isActive) {
                return `❌ 연결되지 않음

현재 하쿠토 월렛과 연결되어 있지 않습니다.
연결하려면 /connect 명령어를 사용하세요.`;
            }

            const connectedDate = connection.connectedAt.toLocaleDateString('ko-KR');
            const lastMessageDate = connection.lastMessageAt 
                ? connection.lastMessageAt.toLocaleDateString('ko-KR')
                : '없음';

            return `✅ 연결됨

사용자명: ${connection.username || '설정되지 않음'}
연결일: ${connectedDate}
마지막 메시지: ${lastMessageDate}

연결을 해제하려면 /disconnect를 입력하세요.`;

        } catch (error) {
            return '상태 확인 중 오류가 발생했습니다.';
        }
    }

    /**
     * /disconnect 명령어 처리
     */
    private async handleDisconnectCommand(chatId: string): Promise<string> {
        try {
            const connection = await this.telegramRepository.findByChatId(chatId);
            
            if (!connection) {
                return '연결된 계정이 없습니다.';
            }

            await this.telegramRepository.disconnect(connection.userId);
            
            return `✅ 연결 해제 완료

하쿠토 월렛과의 연결이 해제되었습니다.
더 이상 알림을 받지 않습니다.

다시 연결하려면 /connect 명령어를 사용하세요.`;

        } catch (error) {
            return '연결 해제 중 오류가 발생했습니다.';
        }
    }

    /**
     * /help 명령어 처리
     */
    private handleHelpCommand(): string {
        return `📖 사용 가능한 명령어

/start - 봇 시작 및 환영 메시지
/connect <코드> - 하쿠토 월렛과 연결
/status - 현재 연결 상태 확인
/disconnect - 연결 해제
/help - 이 도움말 보기

💡 사용법:
1. 하쿠토 월렛 앱에서 연결 코드 생성
2. /connect 명령어로 연결
3. 알림 수신 시작!

문의사항이 있으시면 고객지원팀에 연락하세요.`;
    }

    /**
     * 랜덤 연결 코드 생성
     */
    private generateRandomCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    }

    /**
     * 메시지 포맷팅 (HTML)
     */
    formatMessage(title: string, message: string, data?: any): string {
        let formatted = `<b>${title}</b>\n\n${message}`;
        
        if (data) {
            formatted += '\n\n';
            if (data.price) {
                formatted += `💰 가격: $${data.price}`;
            }
            if (data.change) {
                const emoji = data.change > 0 ? '📈' : '📉';
                formatted += `\n${emoji} 변동: ${data.change > 0 ? '+' : ''}${data.change}%`;
            }
        }
        
        return formatted;
    }
}
