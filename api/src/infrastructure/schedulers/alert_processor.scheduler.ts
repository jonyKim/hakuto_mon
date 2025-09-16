import * as cron from 'node-cron';
import { AlertService } from '../../application/alert.service';
import { TelegramService } from '../../application/telegram.service';
import { NotificationService } from '../../application/notification.service';

export interface AlertProcessorStats {
    totalProcessed: number;
    totalTriggered: number;
    totalFailed: number;
    lastRun: Date;
    nextRun: Date;
}

export class AlertProcessorScheduler {
    private alertService: AlertService;
    private telegramService: TelegramService;
    private notificationService: NotificationService;
    private isRunning: boolean = false;
    private stats: AlertProcessorStats;

    constructor(
        alertService: AlertService,
        telegramService: TelegramService,
        notificationService: NotificationService
    ) {
        this.alertService = alertService;
        this.telegramService = telegramService;
        this.notificationService = notificationService;
        
        this.stats = {
            totalProcessed: 0,
            totalTriggered: 0,
            totalFailed: 0,
            lastRun: new Date(),
            nextRun: new Date()
        };
    }

    /**
     * 스케줄러 시작
     */
    start(): void {
        if (this.isRunning) {
            console.log('Alert processor scheduler is already running');
            return;
        }

        console.log('Starting alert processor scheduler...');
        this.isRunning = true;

        // 1분마다 모든 알림 조건 체크
        cron.schedule('*/1 * * * *', async () => {
            try {
                await this.processAllAlerts();
            } catch (error) {
                console.error('Error in alert processing job:', error);
                this.stats.totalFailed++;
            }
        });

        // 5분마다 실패한 알림 재시도
        cron.schedule('*/5 * * * *', async () => {
            try {
                await this.retryFailedNotifications();
            } catch (error) {
                console.error('Error in retry failed notifications job:', error);
            }
        });

        // 15분마다 텔레그램 만료 코드 정리
        cron.schedule('*/15 * * * *', async () => {
            try {
                await this.telegramService.cleanupExpiredCodes();
            } catch (error) {
                console.error('Error in telegram cleanup job:', error);
            }
        });

        // 매시간 알림 통계 업데이트
        cron.schedule('0 * * * *', async () => {
            try {
                await this.updateAlertStats();
            } catch (error) {
                console.error('Error in alert stats update job:', error);
            }
        });

        // 매일 오전 9시에 일일 요약 알림 발송
        cron.schedule('0 9 * * *', async () => {
            try {
                await this.sendDailySummary();
            } catch (error) {
                console.error('Error in daily summary job:', error);
            }
        });

        console.log('Alert processor scheduler started successfully');
    }

    /**
     * 스케줄러 중지
     */
    stop(): void {
        if (!this.isRunning) {
            console.log('Alert processor scheduler is not running');
            return;
        }

        console.log('Stopping alert processor scheduler...');
        this.isRunning = false;

        console.log('Alert processor scheduler stopped');
    }

    /**
     * 모든 알림 처리
     */
    private async processAllAlerts(): Promise<void> {
        try {
            const startTime = Date.now();
            console.log('Processing all alerts...');

            // 모든 활성 알림 처리
            await this.alertService.processAlerts();

            const processingTime = Date.now() - startTime;
            this.stats.totalProcessed++;
            this.stats.lastRun = new Date();
            
            console.log(`Alert processing completed in ${processingTime}ms`);

        } catch (error) {
            console.error('Error processing alerts:', error);
            this.stats.totalFailed++;
            throw error;
        }
    }

    /**
     * 실패한 알림 재시도
     */
    private async retryFailedNotifications(): Promise<void> {
        try {
            console.log('Retrying failed notifications...');

            // NotificationService를 통해 실패한 알림 재시도
            const retryCount = await this.notificationService.retryFailedNotifications(10);
            
            if (retryCount > 0) {
                console.log(`Retried ${retryCount} failed notifications`);
            }

        } catch (error) {
            console.error('Error retrying failed notifications:', error);
        }
    }

    /**
     * 알림 통계 업데이트
     */
    private async updateAlertStats(): Promise<void> {
        try {
            console.log('Updating alert statistics...');

            // 알림 통계 조회 및 로깅
            const stats = await this.alertService.getAlertStats();
            
            console.log(`Alert Stats - Total: ${stats.totalAlerts}, Active: ${stats.activeAlerts}, Triggered Today: ${stats.triggeredToday}`);

        } catch (error) {
            console.error('Error updating alert stats:', error);
        }
    }

    /**
     * 일일 요약 알림 발송
     */
    private async sendDailySummary(): Promise<void> {
        try {
            console.log('Sending daily summary notifications...');

            // 관리자에게 일일 요약 발송
            const stats = await this.alertService.getAlertStats();
            const telegramStats = await this.telegramService.getConnectionStats();

            const summaryMessage = this.generateDailySummaryMessage(stats, telegramStats);
            
            // 관리자 채널에 브로드캐스트 (실제 구현에서는 관리자 그룹 설정)
            console.log('Daily Summary:', summaryMessage);

        } catch (error) {
            console.error('Error sending daily summary:', error);
        }
    }

    /**
     * 일일 요약 메시지 생성
     */
    private generateDailySummaryMessage(alertStats: any, telegramStats: any): string {
        const today = new Date().toLocaleDateString('ko-KR');
        
        return `📊 하쿠토 월렛 일일 요약 (${today})

🔔 알림 현황:
• 총 알림 규칙: ${alertStats.totalAlerts}개
• 활성 알림: ${alertStats.activeAlerts}개
• 오늘 트리거된 알림: ${alertStats.triggeredToday}개

📱 텔레그램 연결:
• 총 연결: ${telegramStats.totalConnections}개
• 활성 연결: ${telegramStats.activeConnections}개
• 대기 중인 코드: ${telegramStats.pendingCodes}개

📈 알림 유형별 현황:
• 가격 알림: ${alertStats.byType.price_target || 0}개
• 이벤트 알림: ${alertStats.byType.event || 0}개
• 포트폴리오 알림: ${alertStats.byType.portfolio || 0}개

시스템이 정상적으로 운영되고 있습니다. ✅`;
    }

    /**
     * 긴급 알림 처리
     */
    async processUrgentAlerts(): Promise<void> {
        try {
            console.log('Processing urgent alerts...');

            // 높은 우선순위 알림만 처리
            // 실제 구현에서는 우선순위 필터링 로직 추가
            await this.alertService.processAlerts();

        } catch (error) {
            console.error('Error processing urgent alerts:', error);
        }
    }

    /**
     * 특정 사용자 알림 처리
     */
    async processUserAlerts(userId: string): Promise<void> {
        try {
            console.log(`Processing alerts for user: ${userId}`);

            // 특정 사용자의 알림만 처리
            const userAlerts = await this.alertService.getAlerts(userId);
            
            for (const alert of userAlerts) {
                if (alert.isActive && alert.status === 'active') {
                    // 개별 알림 조건 체크 및 처리
                    // 실제 구현에서는 AlertService에 개별 처리 메서드 추가
                }
            }

        } catch (error) {
            console.error(`Error processing alerts for user ${userId}:`, error);
        }
    }

    /**
     * 알림 처리 일시 중지
     */
    pauseProcessing(): void {
        console.log('Pausing alert processing...');
        this.isRunning = false;
    }

    /**
     * 알림 처리 재개
     */
    resumeProcessing(): void {
        console.log('Resuming alert processing...');
        this.isRunning = true;
    }

    /**
     * 스케줄러 상태 및 통계 조회
     */
    getStats(): AlertProcessorStats & { isRunning: boolean } {
        return {
            ...this.stats,
            isRunning: this.isRunning,
            nextRun: this.calculateNextRun()
        };
    }

    /**
     * 다음 실행 시간 계산
     */
    private calculateNextRun(): Date {
        const now = new Date();
        const nextMinute = new Date(now);
        nextMinute.setMinutes(now.getMinutes() + 1, 0, 0);
        return nextMinute;
    }

    /**
     * 수동 알림 처리 트리거
     */
    async triggerManualProcessing(): Promise<{
        processed: number;
        triggered: number;
        failed: number;
        duration: number;
    }> {
        const startTime = Date.now();
        let processed = 0;
        let triggered = 0;
        let failed = 0;

        try {
            console.log('Manual alert processing triggered');
            
            await this.processAllAlerts();
            processed++;
            
            const duration = Date.now() - startTime;
            
            return {
                processed,
                triggered,
                failed,
                duration
            };

        } catch (error) {
            failed++;
            console.error('Manual alert processing failed:', error);
            
            return {
                processed,
                triggered,
                failed,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * 알림 처리 성능 모니터링
     */
    async monitorPerformance(): Promise<{
        averageProcessingTime: number;
        successRate: number;
        alertsPerMinute: number;
    }> {
        try {
            // 성능 메트릭 계산
            const totalRuns = this.stats.totalProcessed + this.stats.totalFailed;
            const successRate = totalRuns > 0 ? (this.stats.totalProcessed / totalRuns) * 100 : 0;
            
            return {
                averageProcessingTime: 1500, // 임시값 (ms)
                successRate,
                alertsPerMinute: this.stats.totalTriggered / Math.max(totalRuns, 1)
            };

        } catch (error) {
            console.error('Error monitoring performance:', error);
            return {
                averageProcessingTime: 0,
                successRate: 0,
                alertsPerMinute: 0
            };
        }
    }
}
