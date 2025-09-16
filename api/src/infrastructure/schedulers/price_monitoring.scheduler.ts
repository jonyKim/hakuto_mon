import * as cron from 'node-cron';
import { PriceMonitoringService } from '../../application/price_monitoring.service';
import { AssetPriceRepository } from '../repositories/asset_price.repository';
import { AlertRuleRepository } from '../repositories/alert_rule.repository';
import { NotificationHistoryRepository } from '../repositories/notification_history.repository';
import { NotificationService } from '../../application/notification.service';

export class PriceMonitoringScheduler {
  private priceMonitoringService: PriceMonitoringService;
  private isRunning: boolean = false;
  private cronJob: cron.ScheduledTask | null = null;
  private stats = {
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    alertsTriggered: 0,
    lastRun: null as Date | null,
    lastSuccess: null as Date | null,
    lastError: null as string | null
  };

  constructor() {
    // 의존성 주입
    const assetPriceRepository = new AssetPriceRepository();
    const alertRuleRepository = new AlertRuleRepository();
    const notificationHistoryRepository = new NotificationHistoryRepository();
    const notificationService = new NotificationService();
    
    this.priceMonitoringService = new PriceMonitoringService(
      assetPriceRepository,
      alertRuleRepository,
      notificationHistoryRepository,
      notificationService
    );
  }

  /**
   * 가격 모니터링 스케줄러 시작 - 매분 실행 (가격 수집 후)
   */
  start(): void {
    if (this.isRunning) {
      console.log('[PriceMonitoringScheduler] 이미 실행 중입니다.');
      return;
    }

    console.log('[PriceMonitoringScheduler] HKTM 가격 모니터링 스케줄러 시작...');
    
    // 매분 30초에 실행 (가격 수집 후 30초 뒤)
    this.cronJob = cron.schedule('30 * * * * *', async () => {
      await this.executeMonitoring();
    }, {
      scheduled: true,
      timezone: 'Asia/Seoul'
    });

    this.isRunning = true;
    console.log('[PriceMonitoringScheduler] 스케줄러가 시작되었습니다. (매분 30초에 실행)');

    // 시작 시 30초 후 첫 실행
    setTimeout(() => {
      this.executeMonitoring();
    }, 30000);
  }

  /**
   * 스케줄러 중지
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('[PriceMonitoringScheduler] 스케줄러가 실행 중이 아닙니다.');
      return;
    }

    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }

    this.isRunning = false;
    console.log('[PriceMonitoringScheduler] 스케줄러가 중지되었습니다.');
  }

  /**
   * 가격 모니터링 실행
   */
  private async executeMonitoring(): Promise<void> {
    const startTime = new Date();
    this.stats.totalRuns++;
    this.stats.lastRun = startTime;

    try {
      console.log(`[PriceMonitoringScheduler] ${startTime.toISOString()} - 가격 모니터링 시작`);

      // HKTM 가격 알림 모니터링 실행
      await this.priceMonitoringService.monitorHktmPriceAlerts();
      
      this.stats.successfulRuns++;
      this.stats.lastSuccess = new Date();
      this.stats.lastError = null;
      
      const duration = Date.now() - startTime.getTime();
      console.log(`[PriceMonitoringScheduler] 가격 모니터링 완료 (${duration}ms)`);

      // 모니터링 통계 업데이트
      await this.updateStats();

    } catch (error) {
      this.stats.failedRuns++;
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      this.stats.lastError = errorMessage;
      
      const duration = Date.now() - startTime.getTime();
      console.error(`[PriceMonitoringScheduler] 가격 모니터링 오류 (${duration}ms):`, errorMessage);
    }
  }

  /**
   * 통계 업데이트
   */
  private async updateStats(): Promise<void> {
    try {
      const monitoringStats = await this.priceMonitoringService.getMonitoringStats(1); // 최근 1시간
      this.stats.alertsTriggered += monitoringStats.alertsTriggered;
    } catch (error) {
      console.warn('[PriceMonitoringScheduler] 통계 업데이트 실패:', error);
    }
  }

  /**
   * 스케줄러 상태 조회
   */
  getStatus(): {
    isRunning: boolean;
    stats: typeof this.stats;
    nextRun?: Date;
    successRate: number;
  } {
    let nextRun: Date | undefined;
    
    if (this.isRunning && this.stats.lastRun) {
      // 다음 실행 시간 계산 (다음 분의 30초)
      nextRun = new Date(this.stats.lastRun);
      nextRun.setMinutes(nextRun.getMinutes() + 1);
      nextRun.setSeconds(30);
      nextRun.setMilliseconds(0);
    }

    const successRate = this.stats.totalRuns > 0 
      ? (this.stats.successfulRuns / this.stats.totalRuns) * 100 
      : 0;

    return {
      isRunning: this.isRunning,
      stats: { ...this.stats },
      nextRun,
      successRate
    };
  }

  /**
   * 수동 실행 (테스트용)
   */
  async executeManually(): Promise<void> {
    console.log('[PriceMonitoringScheduler] 수동 실행 요청');
    await this.executeMonitoring();
  }

  /**
   * 통계 초기화
   */
  resetStats(): void {
    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      alertsTriggered: 0,
      lastRun: null,
      lastSuccess: null,
      lastError: null
    };
    console.log('[PriceMonitoringScheduler] 통계가 초기화되었습니다.');
  }

  /**
   * 스케줄러 재시작
   */
  restart(): void {
    console.log('[PriceMonitoringScheduler] 스케줄러 재시작...');
    this.stop();
    setTimeout(() => {
      this.start();
    }, 1000);
  }

  /**
   * 헬스 체크
   */
  async healthCheck(): Promise<{
    schedulerStatus: 'running' | 'stopped';
    monitoringServiceStatus: boolean;
    lastSuccessfulMonitoring?: Date;
    errorMessage?: string;
    alertsInLast24h: number;
  }> {
    try {
      const monitoringStats = await this.priceMonitoringService.getMonitoringStats(24);
      
      return {
        schedulerStatus: this.isRunning ? 'running' : 'stopped',
        monitoringServiceStatus: true,
        lastSuccessfulMonitoring: this.stats.lastSuccess || undefined,
        errorMessage: this.stats.lastError || undefined,
        alertsInLast24h: monitoringStats.alertsTriggered
      };

    } catch (error) {
      return {
        schedulerStatus: this.isRunning ? 'running' : 'stopped',
        monitoringServiceStatus: false,
        errorMessage: error instanceof Error ? error.message : '헬스 체크 실패',
        alertsInLast24h: 0
      };
    }
  }

  /**
   * 특정 사용자 알림 테스트
   */
  async testUserAlert(userId: string, alertId: string): Promise<boolean> {
    try {
      console.log(`[PriceMonitoringScheduler] 사용자 알림 테스트: ${userId}/${alertId}`);
      return await this.priceMonitoringService.testUserPriceAlert(userId, alertId);
    } catch (error) {
      console.error('[PriceMonitoringScheduler] 알림 테스트 실패:', error);
      return false;
    }
  }

  /**
   * 모니터링 서비스 인스턴스 반환 (외부 접근용)
   */
  getMonitoringService(): PriceMonitoringService {
    return this.priceMonitoringService;
  }
}

// 싱글톤 인스턴스
export const priceMonitoringScheduler = new PriceMonitoringScheduler();
