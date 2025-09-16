import { priceCollectionScheduler } from './price_collection.scheduler';
import { priceMonitoringScheduler } from './price_monitoring.scheduler';

export class SchedulerManager {
  private static instance: SchedulerManager;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): SchedulerManager {
    if (!SchedulerManager.instance) {
      SchedulerManager.instance = new SchedulerManager();
    }
    return SchedulerManager.instance;
  }

  /**
   * 모든 스케줄러 시작
   */
  async startAll(): Promise<void> {
    try {
      console.log('[SchedulerManager] 모든 스케줄러 시작...');

      // 1. 가격 수집 스케줄러 시작 (매분 0초)
      priceCollectionScheduler.start();
      
      // 2. 가격 모니터링 스케줄러 시작 (매분 30초)
      priceMonitoringScheduler.start();

      this.isInitialized = true;
      console.log('[SchedulerManager] 모든 스케줄러가 시작되었습니다.');

      // 스케줄러 상태 로깅
      this.logSchedulerStatus();

    } catch (error) {
      console.error('[SchedulerManager] 스케줄러 시작 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 스케줄러 중지
   */
  stopAll(): void {
    try {
      console.log('[SchedulerManager] 모든 스케줄러 중지...');

      priceCollectionScheduler.stop();
      priceMonitoringScheduler.stop();

      this.isInitialized = false;
      console.log('[SchedulerManager] 모든 스케줄러가 중지되었습니다.');

    } catch (error) {
      console.error('[SchedulerManager] 스케줄러 중지 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 스케줄러 재시작
   */
  async restartAll(): Promise<void> {
    console.log('[SchedulerManager] 모든 스케줄러 재시작...');
    this.stopAll();
    
    // 잠시 대기 후 재시작
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.startAll();
  }

  /**
   * 전체 스케줄러 상태 조회
   */
  getOverallStatus(): {
    isInitialized: boolean;
    priceCollection: any;
    priceMonitoring: any;
    summary: {
      totalSchedulers: number;
      runningSchedulers: number;
      healthySchedulers: number;
    };
  } {
    const priceCollectionStatus = priceCollectionScheduler.getStatus();
    const priceMonitoringStatus = priceMonitoringScheduler.getStatus();

    const runningCount = [priceCollectionStatus.isRunning, priceMonitoringStatus.isRunning]
      .filter(Boolean).length;

    return {
      isInitialized: this.isInitialized,
      priceCollection: priceCollectionStatus,
      priceMonitoring: priceMonitoringStatus,
      summary: {
        totalSchedulers: 2,
        runningSchedulers: runningCount,
        healthySchedulers: runningCount // 간단한 헬스 체크
      }
    };
  }

  /**
   * 헬스 체크
   */
  async healthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    priceCollection: any;
    priceMonitoring: any;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      // 각 스케줄러 헬스 체크
      const priceCollectionHealth = await priceCollectionScheduler.healthCheck();
      const priceMonitoringHealth = await priceMonitoringScheduler.healthCheck();

      // 문제점 수집
      if (priceCollectionHealth.schedulerStatus !== 'running') {
        issues.push('가격 수집 스케줄러가 중지됨');
      }
      if (!priceCollectionHealth.collectionServiceStatus) {
        issues.push('가격 수집 서비스 문제');
      }
      if (priceMonitoringHealth.schedulerStatus !== 'running') {
        issues.push('가격 모니터링 스케줄러가 중지됨');
      }
      if (!priceMonitoringHealth.monitoringServiceStatus) {
        issues.push('가격 모니터링 서비스 문제');
      }

      // 전체 상태 결정
      let overall: 'healthy' | 'degraded' | 'unhealthy';
      if (issues.length === 0) {
        overall = 'healthy';
      } else if (issues.length <= 2) {
        overall = 'degraded';
      } else {
        overall = 'unhealthy';
      }

      return {
        overall,
        priceCollection: priceCollectionHealth,
        priceMonitoring: priceMonitoringHealth,
        issues
      };

    } catch (error) {
      console.error('[SchedulerManager] 헬스 체크 실패:', error);
      return {
        overall: 'unhealthy',
        priceCollection: null,
        priceMonitoring: null,
        issues: ['헬스 체크 실행 실패']
      };
    }
  }

  /**
   * 스케줄러 상태 로깅
   */
  private logSchedulerStatus(): void {
    setInterval(async () => {
      try {
        const status = this.getOverallStatus();
        console.log(`[SchedulerManager] 상태 체크 - 실행중: ${status.summary.runningSchedulers}/${status.summary.totalSchedulers}`);
        
        // 상세 상태 로깅 (5분마다)
        const now = new Date();
        if (now.getMinutes() % 5 === 0 && now.getSeconds() < 30) {
          const health = await this.healthCheck();
          console.log(`[SchedulerManager] 헬스 체크 결과: ${health.overall}`);
          if (health.issues.length > 0) {
            console.warn(`[SchedulerManager] 발견된 문제: ${health.issues.join(', ')}`);
          }
        }

      } catch (error) {
        console.error('[SchedulerManager] 상태 로깅 실패:', error);
      }
    }, 60000); // 1분마다 체크
  }

  /**
   * 수동 실행 (테스트용)
   */
  async executeManually(type: 'collection' | 'monitoring' | 'both'): Promise<void> {
    console.log(`[SchedulerManager] 수동 실행: ${type}`);

    try {
      if (type === 'collection' || type === 'both') {
        await priceCollectionScheduler.executeManually();
      }
      
      if (type === 'monitoring' || type === 'both') {
        // 가격 수집 후 잠시 대기
        if (type === 'both') {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        await priceMonitoringScheduler.executeManually();
      }

      console.log(`[SchedulerManager] 수동 실행 완료: ${type}`);

    } catch (error) {
      console.error(`[SchedulerManager] 수동 실행 실패 (${type}):`, error);
      throw error;
    }
  }

  /**
   * 통계 초기화
   */
  resetAllStats(): void {
    console.log('[SchedulerManager] 모든 스케줄러 통계 초기화...');
    priceCollectionScheduler.resetStats();
    priceMonitoringScheduler.resetStats();
    console.log('[SchedulerManager] 통계 초기화 완료');
  }

  /**
   * 특정 사용자 알림 테스트
   */
  async testUserAlert(userId: string, alertId: string): Promise<boolean> {
    try {
      return await priceMonitoringScheduler.testUserAlert(userId, alertId);
    } catch (error) {
      console.error('[SchedulerManager] 사용자 알림 테스트 실패:', error);
      return false;
    }
  }

  /**
   * 초기화 상태 확인
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 그레이스풀 셧다운
   */
  async gracefulShutdown(): Promise<void> {
    console.log('[SchedulerManager] 그레이스풀 셧다운 시작...');
    
    try {
      // 모든 스케줄러 중지
      this.stopAll();
      
      // 진행 중인 작업 완료 대기
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('[SchedulerManager] 그레이스풀 셧다운 완료');
    } catch (error) {
      console.error('[SchedulerManager] 그레이스풀 셧다운 실패:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const schedulerManager = SchedulerManager.getInstance();
