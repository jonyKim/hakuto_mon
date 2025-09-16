import * as cron from 'node-cron';
import { PriceCollectionService } from '../../application/price_collection.service';
import { MexcService } from '../services/mexc.service';
import { AssetPriceRepository } from '../repositories/asset_price.repository';

export class PriceCollectionScheduler {
  private priceCollectionService: PriceCollectionService;
  private isRunning: boolean = false;
  private cronJob: cron.ScheduledTask | null = null;
  private stats = {
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    lastRun: null as Date | null,
    lastSuccess: null as Date | null,
    lastError: null as string | null
  };

  constructor() {
    // 의존성 주입
    const mexcService = new MexcService();
    const assetPriceRepository = new AssetPriceRepository();
    this.priceCollectionService = new PriceCollectionService(mexcService, assetPriceRepository);
  }

  /**
   * 스케줄러 시작 - 매분 실행
   */
  start(): void {
    if (this.isRunning) {
      console.log('[PriceScheduler] 이미 실행 중입니다.');
      return;
    }

    console.log('[PriceScheduler] HKTM 가격 수집 스케줄러 시작...');
    
    // 매분 0초에 실행 (예: 14:30:00, 14:31:00, 14:32:00...)
    this.cronJob = cron.schedule('0 * * * * *', async () => {
      await this.executeCollection();
    }, {
      scheduled: true,
      timezone: 'Asia/Seoul'
    });

    this.isRunning = true;
    console.log('[PriceScheduler] 스케줄러가 시작되었습니다. (매분 실행)');

    // 시작 시 즉시 한 번 실행
    this.executeCollection();
  }

  /**
   * 스케줄러 중지
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('[PriceScheduler] 스케줄러가 실행 중이 아닙니다.');
      return;
    }

    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }

    this.isRunning = false;
    console.log('[PriceScheduler] 스케줄러가 중지되었습니다.');
  }

  /**
   * 가격 수집 실행
   */
  private async executeCollection(): Promise<void> {
    const startTime = new Date();
    this.stats.totalRuns++;
    this.stats.lastRun = startTime;

    try {
      console.log(`[PriceScheduler] ${startTime.toISOString()} - HKTM 가격 수집 시작`);

      // 재시도 로직과 함께 가격 수집
      const result = await this.priceCollectionService.collectWithRetry(3, 2000);
      
      if (result) {
        this.stats.successfulRuns++;
        this.stats.lastSuccess = new Date();
        this.stats.lastError = null;
        
        const duration = Date.now() - startTime.getTime();
        console.log(`[PriceScheduler] 가격 수집 성공 (${duration}ms) - Price: $${result.priceUsd}`);
      } else {
        this.stats.failedRuns++;
        this.stats.lastError = '가격 수집 결과 없음';
        console.error('[PriceScheduler] 가격 수집 실패 - 결과 없음');
      }

    } catch (error) {
      this.stats.failedRuns++;
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      this.stats.lastError = errorMessage;
      
      const duration = Date.now() - startTime.getTime();
      console.error(`[PriceScheduler] 가격 수집 오류 (${duration}ms):`, errorMessage);
    }
  }

  /**
   * 스케줄러 상태 조회
   */
  getStatus(): {
    isRunning: boolean;
    stats: typeof this.stats;
    nextRun?: Date;
  } {
    let nextRun: Date | undefined;
    
    if (this.isRunning && this.stats.lastRun) {
      // 다음 실행 시간 계산 (다음 분의 0초)
      nextRun = new Date(this.stats.lastRun);
      nextRun.setMinutes(nextRun.getMinutes() + 1);
      nextRun.setSeconds(0);
      nextRun.setMilliseconds(0);
    }

    return {
      isRunning: this.isRunning,
      stats: { ...this.stats },
      nextRun
    };
  }

  /**
   * 수동 실행 (테스트용)
   */
  async executeManually(): Promise<void> {
    console.log('[PriceScheduler] 수동 실행 요청');
    await this.executeCollection();
  }

  /**
   * 통계 초기화
   */
  resetStats(): void {
    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastRun: null,
      lastSuccess: null,
      lastError: null
    };
    console.log('[PriceScheduler] 통계가 초기화되었습니다.');
  }

  /**
   * 성공률 계산
   */
  getSuccessRate(): number {
    if (this.stats.totalRuns === 0) return 0;
    return (this.stats.successfulRuns / this.stats.totalRuns) * 100;
  }

  /**
   * 스케줄러 재시작
   */
  restart(): void {
    console.log('[PriceScheduler] 스케줄러 재시작...');
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
    collectionServiceStatus: boolean;
    lastSuccessfulCollection?: Date;
    errorMessage?: string;
  }> {
    try {
      const collectionHealth = await this.priceCollectionService.checkCollectionHealth();
      
      return {
        schedulerStatus: this.isRunning ? 'running' : 'stopped',
        collectionServiceStatus: collectionHealth.isHealthy,
        lastSuccessfulCollection: this.stats.lastSuccess || undefined,
        errorMessage: collectionHealth.errorMessage || this.stats.lastError || undefined
      };

    } catch (error) {
      return {
        schedulerStatus: this.isRunning ? 'running' : 'stopped',
        collectionServiceStatus: false,
        errorMessage: error instanceof Error ? error.message : '헬스 체크 실패'
      };
    }
  }
}

// 싱글톤 인스턴스
export const priceCollectionScheduler = new PriceCollectionScheduler();
