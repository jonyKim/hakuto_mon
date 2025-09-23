import { AlertRuleRepository } from '../infrastructure/repositories/alert_rule.repository';
import { NotificationHistoryRepository } from '../infrastructure/repositories/notification_history.repository';
import { PortfolioRepository } from '../infrastructure/repositories/portfolio.repository';
import { EventRepository } from '../infrastructure/repositories/event.repository';
import { TelegramConnectionRepository } from '../infrastructure/repositories/telegram_connection.repository';
import { WalletUserRepository } from '../infrastructure/repositories/wallet_user.repository';
import { NotificationService } from './notification.service';
import { TelegramService } from './telegram.service';
import { AlertRule, AlertCondition, AlertChannel } from '../domain/entities/alert_rule.entity';
// import { NotificationHistory } from '../domain/entities/notification_history.entity';

export interface CreateAlertRequest {
    userId: string;
    type: 'price_target' | 'event' | 'portfolio';
    name: string;
    assetSymbol?: string;
    conditions: AlertCondition[];
    channels: AlertChannel[];
    frequency?: 'immediate' | '5min' | '1hour' | 'daily';
    memo?: string;
}

export interface UpdateAlertRequest {
    id: string;
    name?: string;
    conditions?: AlertCondition[];
    channels?: AlertChannel[];
    frequency?: 'immediate' | '5min' | '1hour' | 'daily';
    isActive?: boolean;
    status?: 'active' | 'inactive' | 'paused';
    memo?: string;
}

export interface AlertStats {
    totalAlerts: number;
    activeAlerts: number;
    triggeredToday: number;
    byType: { [key: string]: number };
    recentTriggers: AlertRule[];
}

export class AlertService {
    private alertRepository: AlertRuleRepository;
    private notificationHistoryRepository: NotificationHistoryRepository;
    private portfolioRepository: PortfolioRepository;
    private eventRepository: EventRepository;
    private telegramRepository: TelegramConnectionRepository;
    private userRepository: WalletUserRepository;
    private notificationService: NotificationService;
    private telegramService: TelegramService;

    constructor(
        alertRepository: AlertRuleRepository,
        notificationHistoryRepository: NotificationHistoryRepository,
        portfolioRepository: PortfolioRepository,
        eventRepository: EventRepository,
        telegramRepository: TelegramConnectionRepository,
        userRepository: WalletUserRepository,
        notificationService: NotificationService,
        telegramService: TelegramService
    ) {
        this.alertRepository = alertRepository;
        this.notificationHistoryRepository = notificationHistoryRepository;
        this.portfolioRepository = portfolioRepository;
        this.eventRepository = eventRepository;
        this.telegramRepository = telegramRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.telegramService = telegramService;
    }

    /**
     * 알림 규칙 생성
     */
    async createAlert(request: CreateAlertRequest): Promise<AlertRule> {
        try {
            // 사용자 존재 확인
            const user = await this.userRepository.findById(request.userId);
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            // 알림 규칙 생성
            const alertRule = await this.alertRepository.create({
                userId: request.userId,
                type: request.type,
                name: request.name,
                assetSymbol: request.assetSymbol,
                conditions: request.conditions,
                channels: request.channels,
                frequency: request.frequency || 'immediate',
                isActive: true,
                status: 'active',
                memo: request.memo
            });

            console.log(`Alert rule created: ${alertRule.id} for user ${request.userId}`);
            return alertRule;

        } catch (error) {
            console.error('Error creating alert rule:', error);
            throw error;
        }
    }

    /**
     * 알림 규칙 조회
     */
    async getAlerts(userId: string, type?: string, status?: string): Promise<AlertRule[]> {
        try {
            return await this.alertRepository.findByUserId(userId, type, status);
        } catch (error) {
            console.error('Error getting alerts:', error);
            throw error;
        }
    }

    /**
     * 알림 규칙 상세 조회
     */
    async getAlert(alertId: string): Promise<AlertRule | null> {
        try {
            return await this.alertRepository.findById(alertId);
        } catch (error) {
            console.error('Error getting alert:', error);
            throw error;
        }
    }

    /**
     * 알림 규칙 수정
     */
    async updateAlert(request: UpdateAlertRequest): Promise<AlertRule | null> {
        try {
            const existingAlert = await this.alertRepository.findById(request.id);
            if (!existingAlert) {
                throw new Error('알림 규칙을 찾을 수 없습니다.');
            }

            const updateData: Partial<AlertRule> = {};
            
            if (request.name !== undefined) updateData.name = request.name;
            if (request.conditions !== undefined) updateData.conditions = request.conditions;
            if (request.channels !== undefined) updateData.channels = request.channels;
            if (request.frequency !== undefined) updateData.frequency = request.frequency;
            if (request.isActive !== undefined) updateData.isActive = request.isActive;
            if (request.status !== undefined) updateData.status = request.status;
            if (request.memo !== undefined) updateData.memo = request.memo;

            const updatedAlert = await this.alertRepository.update(request.id, updateData);
            
            console.log(`Alert rule updated: ${request.id}`);
            return updatedAlert;

        } catch (error) {
            console.error('Error updating alert rule:', error);
            throw error;
        }
    }

    /**
     * 알림 규칙 삭제
     */
    async deleteAlert(alertId: string): Promise<void> {
        try {
            const alert = await this.alertRepository.findById(alertId);
            if (!alert) {
                throw new Error('알림 규칙을 찾을 수 없습니다.');
            }

            await this.alertRepository.delete(alertId);
            console.log(`Alert rule deleted: ${alertId}`);

        } catch (error) {
            console.error('Error deleting alert rule:', error);
            throw error;
        }
    }

    /**
     * 테스트 알림 발송
     */
    async sendTestNotification(alertId: string): Promise<void> {
        try {
            const alert = await this.alertRepository.findById(alertId);
            if (!alert) {
                throw new Error('알림 규칙을 찾을 수 없습니다.');
            }

            const testMessage = this.generateTestMessage(alert);
            await this.sendAlertNotification(alert, testMessage, true);

            console.log(`Test notification sent for alert: ${alertId}`);

        } catch (error) {
            console.error('Error sending test notification:', error);
            throw error;
        }
    }

    /**
     * 활성 알림들 처리 (스케줄러에서 호출)
     */
    async processAlerts(): Promise<void> {
        try {
            const activeAlerts = await this.alertRepository.findActiveAlerts();
            
            for (const alert of activeAlerts) {
                try {
                    const shouldTrigger = await this.checkAlertCondition(alert);
                    if (shouldTrigger) {
                        await this.triggerAlert(alert);
                    }
                } catch (error) {
                    console.error(`Error processing alert ${alert.id}:`, error);
                }
            }

        } catch (error) {
            console.error('Error processing alerts:', error);
        }
    }

    /**
     * 가격 알림 처리
     */
    async processPriceAlerts(): Promise<void> {
        try {
            const priceAlerts = await this.alertRepository.findActiveAlertsByType('price_target');
            
            for (const alert of priceAlerts) {
                try {
                    const shouldTrigger = await this.checkPriceCondition(alert);
                    if (shouldTrigger) {
                        await this.triggerAlert(alert);
                    }
                } catch (error) {
                    console.error(`Error processing price alert ${alert.id}:`, error);
                }
            }

        } catch (error) {
            console.error('Error processing price alerts:', error);
        }
    }

    /**
     * 알림 조건 확인
     */
    private async checkAlertCondition(alert: AlertRule): Promise<boolean> {
        switch (alert.type) {
            case 'price_target':
                return await this.checkPriceCondition(alert);
            case 'portfolio':
                return await this.checkPortfolioCondition(alert);
            case 'event':
                return await this.checkEventCondition(alert);
            default:
                return false;
        }
    }

    /**
     * 가격 조건 확인
     */
    private async checkPriceCondition(alert: AlertRule): Promise<boolean> {
        try {
            if (!alert.assetSymbol) return false;

            // 현재 가격 조회 (실제 구현에서는 가격 서비스 사용)
            const currentPrice = await this.getCurrentPrice(alert.assetSymbol);
            if (!currentPrice) return false;

            // 조건 확인
            for (const condition of alert.conditions) {
                switch (condition.type) {
                    case 'above':
                        if (currentPrice > condition.value) return true;
                        break;
                    case 'below':
                        if (currentPrice < condition.value) return true;
                        break;
                    case 'both':
                        // 양방향 조건 (상한선과 하한선)
                        if (alert.conditions.length >= 2) {
                            const upperLimit = Math.max(...alert.conditions.map(c => c.value));
                            const lowerLimit = Math.min(...alert.conditions.map(c => c.value));
                            if (currentPrice > upperLimit || currentPrice < lowerLimit) return true;
                        }
                        break;
                }
            }

            return false;

        } catch (error) {
            console.error('Error checking price condition:', error);
            return false;
        }
    }

    /**
     * 포트폴리오 조건 확인
     */
    private async checkPortfolioCondition(alert: AlertRule): Promise<boolean> {
        try {
            const portfolio = await this.portfolioRepository.findByUserId(alert.userId);
            if (!portfolio) return false;

            for (const condition of alert.conditions) {
                switch (condition.type) {
                    case 'portfolio_value':
                        if (condition.comparison === 'greater_than' && portfolio.totalValue > condition.value) return true;
                        if (condition.comparison === 'less_than' && portfolio.totalValue < condition.value) return true;
                        break;
                    case 'profit_loss':
                        if (condition.comparison === 'greater_than' && portfolio.profitLossPercentage > condition.value) return true;
                        if (condition.comparison === 'less_than' && portfolio.profitLossPercentage < condition.value) return true;
                        break;
                }
            }

            return false;

        } catch (error) {
            console.error('Error checking portfolio condition:', error);
            return false;
        }
    }

    /**
     * 이벤트 조건 확인
     */
    private async checkEventCondition(alert: AlertRule): Promise<boolean> {
        try {
            // 최근 활성화된 이벤트 확인
            const recentEvents = await this.eventRepository.findActiveEvents();
            
            // 알림 설정에 따른 이벤트 필터링 로직
            // (실제 구현에서는 더 복잡한 조건 확인)
            return recentEvents.length > 0;

        } catch (error) {
            console.error('Error checking event condition:', error);
            return false;
        }
    }

    /**
     * 알림 트리거
     */
    private async triggerAlert(alert: AlertRule): Promise<void> {
        try {
            // 빈도 제한 확인
            if (!this.shouldTriggerByFrequency(alert)) {
                return;
            }

            const message = this.generateAlertMessage(alert);
            await this.sendAlertNotification(alert, message);

            // 알림 트리거 기록 업데이트
            await this.alertRepository.updateTriggered(alert.id);

            console.log(`Alert triggered: ${alert.id}`);

        } catch (error) {
            console.error('Error triggering alert:', error);
        }
    }

    /**
     * 빈도 제한 확인
     */
    private shouldTriggerByFrequency(alert: AlertRule): boolean {
        if (!alert.lastTriggeredAt) return true;

        const now = new Date();
        const lastTriggered = alert.lastTriggeredAt;
        const timeDiff = now.getTime() - lastTriggered.getTime();

        switch (alert.frequency) {
            case 'immediate':
                return true;
            case '5min':
                return timeDiff >= 5 * 60 * 1000;
            case '1hour':
                return timeDiff >= 60 * 60 * 1000;
            case 'daily':
                return timeDiff >= 24 * 60 * 60 * 1000;
            default:
                return true;
        }
    }

    /**
     * 알림 메시지 발송
     */
    private async sendAlertNotification(alert: AlertRule, message: string, isTest: boolean = false): Promise<void> {
        try {
            const user = await this.userRepository.findById(alert.userId);
            if (!user) return;

            const title = isTest ? `[테스트] ${alert.name}` : alert.name;

            // 알림 히스토리 생성
            const notificationHistory = await this.notificationHistoryRepository.create({
                alertId: alert.id,
                userId: alert.userId,
                type: alert.type,
                title,
                message,
                channels: alert.channels.map(channel => ({
                    type: channel.type,
                    status: 'pending'
                })),
                status: 'pending'
            });

            // 채널별 알림 발송
            for (const channel of alert.channels) {
                if (!channel.enabled) continue;

                try {
                    switch (channel.type) {
                        case 'push':
                            if (user.fcmToken) {
                                await this.notificationService.sendFCMNotification(user.fcmToken, {
                                    title,
                                    body: message,
                                    data: { alertId: alert.id, isTest: isTest.toString() }
                                });
                            }
                            break;

                        case 'email':
                            if (user.email && user.emailVerified) {
                                await this.notificationService.sendEmailNotification(user.email, title, message);
                            }
                            break;

                        case 'telegram':
                            const telegramConnection = await this.telegramRepository.findByUserId(alert.userId);
                            if (telegramConnection?.isActive) {
                                await this.telegramService.sendMessage(telegramConnection.chatId, `${title}\n\n${message}`);
                            }
                            break;
                    }
                } catch (channelError) {
                    console.error(`Error sending ${channel.type} notification:`, channelError);
                }
            }

            // 알림 히스토리 상태 업데이트
            await this.notificationHistoryRepository.updateStatus(notificationHistory.id, 'sent');

        } catch (error) {
            console.error('Error sending alert notification:', error);
        }
    }

    /**
     * 알림 메시지 생성
     */
    private generateAlertMessage(alert: AlertRule): string {
        switch (alert.type) {
            case 'price_target':
                return `${alert.assetSymbol} 가격이 설정한 조건에 도달했습니다.`;
            case 'portfolio':
                return '포트폴리오가 설정한 조건에 도달했습니다.';
            case 'event':
                return '관심 있는 이벤트가 발생했습니다.';
            default:
                return '알림 조건이 충족되었습니다.';
        }
    }

    /**
     * 테스트 메시지 생성
     */
    private generateTestMessage(alert: AlertRule): string {
        return `이것은 "${alert.name}" 알림의 테스트 메시지입니다. 실제 조건이 충족되면 이와 같은 알림을 받게 됩니다.`;
    }

    /**
     * 현재 가격 조회 (임시 구현)
     */
    private async getCurrentPrice(assetSymbol: string): Promise<number | null> {
        // 실제 구현에서는 가격 서비스나 외부 API 사용
        // 임시로 랜덤 가격 반환
        const mockPrices: { [key: string]: number } = {
            'BTC': 45000,
            'ETH': 3000,
            'HKTM': 0.08,
            'BNB': 300
        };

        return mockPrices[assetSymbol] || null;
    }

    /**
     * 알림 통계 조회
     */
    async getAlertStats(userId?: string): Promise<AlertStats> {
        try {
            const totalAlerts = userId 
                ? await this.alertRepository.countByUserId(userId)
                : await this.alertRepository.count();

            const activeAlerts = await this.alertRepository.countActiveAlerts();

            const byType = {
                price_target: await this.alertRepository.countByType('price_target'),
                event: await this.alertRepository.countByType('event'),
                portfolio: await this.alertRepository.countByType('portfolio')
            };

            const recentTriggers = await this.alertRepository.findRecentlyTriggered(5);

            // 오늘 트리거된 알림 수 (임시 구현)
            const triggeredToday = 0;

            return {
                totalAlerts,
                activeAlerts,
                triggeredToday,
                byType,
                recentTriggers
            };

        } catch (error) {
            console.error('Error getting alert stats:', error);
            throw error;
        }
    }
}
