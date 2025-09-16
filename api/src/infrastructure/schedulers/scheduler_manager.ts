import { PriceMonitorScheduler } from './price_monitor.scheduler';
import { AlertProcessorScheduler } from './alert_processor.scheduler';
import { AlertService } from '../../application/alert.service';
import { PortfolioService } from '../../application/portfolio.service';
import { EventService } from '../../application/event.service';
import { TelegramService } from '../../application/telegram.service';
import { NotificationService } from '../../application/notification.service';

export interface SchedulerStatus {
    priceMonitor: {
        isRunning: boolean;
        activeTasks: number;
        lastUpdate: Date;
    };
    alertProcessor: {
        isRunning: boolean;
        totalProcessed: number;
        totalTriggered: number;
        totalFailed: number;
        lastRun: Date;
    };
    system: {
        uptime: number;
        startedAt: Date;
        environment: string;
    };
}

export class SchedulerManager {
    private priceMonitorScheduler: PriceMonitorScheduler;
    private alertProcessorScheduler: AlertProcessorScheduler;
    private startedAt: Date;
    private isInitialized: boolean = false;

    constructor(
        alertService: AlertService,
        portfolioService: PortfolioService,
        eventService: EventService,
        telegramService: TelegramService,
        notificationService: NotificationService
    ) {
        this.priceMonitorScheduler = new PriceMonitorScheduler(
            alertService,
            portfolioService,
            eventService
        );

        this.alertProcessorScheduler = new AlertProcessorScheduler(
            alertService,
            telegramService,
            notificationService
        );

        this.startedAt = new Date();
    }

    /**
     * 모든 스케줄러 시작
     */
    async startAll(): Promise<void> {
        try {
            console.log('🚀 Starting Hakuto Wallet Alert System Schedulers...');

            // 환경 변수 확인
            this.validateEnvironment();

            // 가격 모니터 스케줄러 시작
            console.log('📊 Starting Price Monitor Scheduler...');
            this.priceMonitorScheduler.start();

            // 알림 처리 스케줄러 시작
            console.log('🔔 Starting Alert Processor Scheduler...');
            this.alertProcessorScheduler.start();

            this.isInitialized = true;
            console.log('✅ All schedulers started successfully');
            console.log(`🕐 System started at: ${this.startedAt.toISOString()}`);

        } catch (error) {
            console.error('❌ Error starting schedulers:', error);
            throw error;
        }
    }

    /**
     * 모든 스케줄러 중지
     */
    async stopAll(): Promise<void> {
        try {
            console.log('🛑 Stopping all schedulers...');

            this.priceMonitorScheduler.stop();
            this.alertProcessorScheduler.stop();

            this.isInitialized = false;
            console.log('✅ All schedulers stopped successfully');

        } catch (error) {
            console.error('❌ Error stopping schedulers:', error);
            throw error;
        }
    }

    /**
     * 스케줄러 재시작
     */
    async restart(): Promise<void> {
        console.log('🔄 Restarting schedulers...');
        await this.stopAll();
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
        await this.startAll();
        console.log('✅ Schedulers restarted successfully');
    }

    /**
     * 전체 시스템 상태 조회
     */
    getStatus(): SchedulerStatus {
        const priceMonitorStatus = this.priceMonitorScheduler.getStatus();
        const alertProcessorStatus = this.alertProcessorScheduler.getStats();

        return {
            priceMonitor: {
                isRunning: priceMonitorStatus.isRunning,
                activeTasks: priceMonitorStatus.activeTasks,
                lastUpdate: priceMonitorStatus.lastUpdate
            },
            alertProcessor: {
                isRunning: alertProcessorStatus.isRunning,
                totalProcessed: alertProcessorStatus.totalProcessed,
                totalTriggered: alertProcessorStatus.totalTriggered,
                totalFailed: alertProcessorStatus.totalFailed,
                lastRun: alertProcessorStatus.lastRun
            },
            system: {
                uptime: Date.now() - this.startedAt.getTime(),
                startedAt: this.startedAt,
                environment: process.env.NODE_ENV || 'development'
            }
        };
    }

    /**
     * 헬스 체크
     */
    async healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        checks: {
            priceMonitor: boolean;
            alertProcessor: boolean;
            database: boolean;
            externalApis: boolean;
        };
        timestamp: Date;
    }> {
        const checks = {
            priceMonitor: this.priceMonitorScheduler.getStatus().isRunning,
            alertProcessor: this.alertProcessorScheduler.getStats().isRunning,
            database: await this.checkDatabaseConnection(),
            externalApis: await this.checkExternalApis()
        };

        const healthyCount = Object.values(checks).filter(Boolean).length;
        let status: 'healthy' | 'degraded' | 'unhealthy';

        if (healthyCount === 4) {
            status = 'healthy';
        } else if (healthyCount >= 2) {
            status = 'degraded';
        } else {
            status = 'unhealthy';
        }

        return {
            status,
            checks,
            timestamp: new Date()
        };
    }

    /**
     * 수동 작업 트리거
     */
    async triggerManualTasks(): Promise<{
        priceUpdate: boolean;
        alertProcessing: boolean;
        portfolioUpdate: boolean;
        timestamp: Date;
    }> {
        const results = {
            priceUpdate: false,
            alertProcessing: false,
            portfolioUpdate: false,
            timestamp: new Date()
        };

        try {
            // 가격 업데이트 트리거
            await this.priceMonitorScheduler.triggerPriceUpdate();
            results.priceUpdate = true;
        } catch (error) {
            console.error('Manual price update failed:', error);
        }

        try {
            // 알림 처리 트리거
            await this.alertProcessorScheduler.triggerManualProcessing();
            results.alertProcessing = true;
        } catch (error) {
            console.error('Manual alert processing failed:', error);
        }

        try {
            // 포트폴리오 업데이트 트리거
            await this.priceMonitorScheduler.triggerPortfolioUpdate();
            results.portfolioUpdate = true;
        } catch (error) {
            console.error('Manual portfolio update failed:', error);
        }

        return results;
    }

    /**
     * 성능 메트릭 조회
     */
    async getPerformanceMetrics(): Promise<{
        alertProcessing: {
            averageProcessingTime: number;
            successRate: number;
            alertsPerMinute: number;
        };
        system: {
            memoryUsage: NodeJS.MemoryUsage;
            cpuUsage: NodeJS.CpuUsage;
            uptime: number;
        };
        timestamp: Date;
    }> {
        const alertMetrics = await this.alertProcessorScheduler.monitorPerformance();

        return {
            alertProcessing: alertMetrics,
            system: {
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
                uptime: process.uptime()
            },
            timestamp: new Date()
        };
    }

    /**
     * 환경 변수 검증
     */
    private validateEnvironment(): void {
        const requiredEnvVars = [
            'DATABASE_URL',
            'FIREBASE_PROJECT_ID',
            'TELEGRAM_BOT_TOKEN'
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
            console.warn('Some features may not work properly');
        }
    }

    /**
     * 데이터베이스 연결 확인
     */
    private async checkDatabaseConnection(): Promise<boolean> {
        try {
            // 실제 구현에서는 데이터베이스 연결 테스트
            // 예: SELECT 1 쿼리 실행
            return true;
        } catch (error) {
            console.error('Database connection check failed:', error);
            return false;
        }
    }

    /**
     * 외부 API 연결 확인
     */
    private async checkExternalApis(): Promise<boolean> {
        try {
            // 실제 구현에서는 외부 API 상태 확인
            // 예: MEXC API, CoinGecko API 등
            return true;
        } catch (error) {
            console.error('External APIs check failed:', error);
            return false;
        }
    }

    /**
     * 긴급 모드 활성화
     */
    async enableEmergencyMode(): Promise<void> {
        console.log('🚨 Enabling emergency mode...');
        
        // 알림 처리 일시 중지
        this.alertProcessorScheduler.pauseProcessing();
        
        // 긴급 알림만 처리
        await this.alertProcessorScheduler.processUrgentAlerts();
        
        console.log('🚨 Emergency mode enabled');
    }

    /**
     * 긴급 모드 해제
     */
    async disableEmergencyMode(): Promise<void> {
        console.log('✅ Disabling emergency mode...');
        
        // 정상 알림 처리 재개
        this.alertProcessorScheduler.resumeProcessing();
        
        console.log('✅ Emergency mode disabled');
    }

    /**
     * 스케줄러 초기화 상태 확인
     */
    isReady(): boolean {
        return this.isInitialized;
    }

    /**
     * 시스템 정보 조회
     */
    getSystemInfo(): {
        version: string;
        nodeVersion: string;
        platform: string;
        architecture: string;
        startedAt: Date;
        uptime: number;
    } {
        return {
            version: process.env.npm_package_version || '1.0.0',
            nodeVersion: process.version,
            platform: process.platform,
            architecture: process.arch,
            startedAt: this.startedAt,
            uptime: Date.now() - this.startedAt.getTime()
        };
    }
}
