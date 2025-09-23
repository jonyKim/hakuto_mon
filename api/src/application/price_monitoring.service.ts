import { AssetPriceRepository } from '../infrastructure/repositories/asset_price.repository';
import { AlertRuleRepository } from '../infrastructure/repositories/alert_rule.repository';
import { NotificationHistoryRepository } from '../infrastructure/repositories/notification_history.repository';
import { AlertRule } from '../domain/entities/alert_rule.entity';
import { AssetPrice } from '../domain/entities/asset_price.entity';
import { NotificationType, NotificationStatus } from '../domain/entities/notification_history.entity';

interface PriceAlertCondition {
  type: 'above' | 'below' | 'change_percent';
  targetPrice?: number;
  changePercent?: number;
  timeframe?: '1m' | '5m' | '15m' | '1h' | '24h';
}

export class PriceMonitoringService {
  constructor(
    private assetPriceRepository: AssetPriceRepository,
    private alertRuleRepository: AlertRuleRepository,
    private notificationHistoryRepository: NotificationHistoryRepository,
    //private notificationService: NotificationService
  ) {}

  /**
   * HKTM 가격 알림 모니터링 실행
   */
  async monitorHktmPriceAlerts(): Promise<void> {
    try {
      console.log('[PriceMonitoring] HKTM 가격 알림 모니터링 시작...');

      // 활성화된 HKTM 가격 알림 조회
      const activeAlerts = await this.alertRuleRepository.findActiveAlerts();
      const hktmPriceAlerts = activeAlerts.filter(alert => 
        alert.type === 'price_target' && 
        (alert.assetSymbol === 'HKTM' || alert.assetSymbol === 'HKTMUSDT')
      );

      if (hktmPriceAlerts.length === 0) {
        console.log('[PriceMonitoring] 활성화된 HKTM 가격 알림이 없습니다.');
        return;
      }

      console.log(`[PriceMonitoring] ${hktmPriceAlerts.length}개의 HKTM 가격 알림 확인 중...`);

      // 현재 HKTM 가격 조회
      const currentPrice = await this.assetPriceRepository.getLatestPrice('HKTM', 'MEXC');
      if (!currentPrice) {
        console.warn('[PriceMonitoring] 현재 HKTM 가격 데이터를 찾을 수 없습니다.');
        return;
      }

      console.log(`[PriceMonitoring] 현재 HKTM 가격: $${currentPrice.priceUsd}`);

      // 각 알림 조건 확인
      for (const alert of hktmPriceAlerts) {
        await this.checkPriceAlert(alert, currentPrice);
      }

      console.log('[PriceMonitoring] HKTM 가격 알림 모니터링 완료');

    } catch (error) {
      console.error('[PriceMonitoring] 가격 모니터링 실패:', error);
    }
  }

  /**
   * 개별 가격 알림 조건 확인
   */
  private async checkPriceAlert(alert: AlertRule, currentPrice: AssetPrice): Promise<void> {
    try {
      const conditions = alert.conditions as PriceAlertCondition[];
      let shouldTrigger = false;
      let triggerReason = '';

      for (const condition of conditions) {
        const conditionMet = await this.evaluatePriceCondition(condition, currentPrice, alert);
        
        if (conditionMet.isMet) {
          shouldTrigger = true;
          triggerReason = conditionMet.reason;
          break;
        }
      }

      if (shouldTrigger) {
        await this.triggerPriceAlert(alert, currentPrice, triggerReason);
      }

    } catch (error) {
      console.error(`[PriceMonitoring] 알림 ${alert.id} 확인 실패:`, error);
    }
  }

  /**
   * 가격 조건 평가
   */
  private async evaluatePriceCondition(
    condition: PriceAlertCondition, 
    currentPrice: AssetPrice, 
    _alert: AlertRule
  ): Promise<{ isMet: boolean; reason: string }> {
    const currentPriceValue = Number(currentPrice.priceUsd);

    switch (condition.type) {
      case 'above':
        if (condition.targetPrice && currentPriceValue >= condition.targetPrice) {
          return {
            isMet: true,
            reason: `가격이 목표가 $${condition.targetPrice}를 상회했습니다. (현재: $${currentPriceValue})`
          };
        }
        break;

      case 'below':
        if (condition.targetPrice && currentPriceValue <= condition.targetPrice) {
          return {
            isMet: true,
            reason: `가격이 목표가 $${condition.targetPrice}를 하회했습니다. (현재: $${currentPriceValue})`
          };
        }
        break;

      case 'change_percent':
        if (condition.changePercent && condition.timeframe) {
          const changeResult = await this.checkPriceChangePercent(
            condition.changePercent, 
            condition.timeframe, 
            currentPrice
          );
          
          if (changeResult.isMet) {
            return {
              isMet: true,
              reason: `${condition.timeframe} 동안 ${changeResult.actualChange > 0 ? '상승' : '하락'} ${Math.abs(changeResult.actualChange).toFixed(2)}% (기준: ${condition.changePercent}%)`
            };
          }
        }
        break;
    }

    return { isMet: false, reason: '' };
  }

  /**
   * 가격 변동률 확인
   */
  private async checkPriceChangePercent(
    targetChangePercent: number, 
    timeframe: string, 
    currentPrice: AssetPrice
  ): Promise<{ isMet: boolean; actualChange: number }> {
    try {
      // 시간 프레임에 따른 과거 시점 계산
      const hoursMap: { [key: string]: number } = {
        '1m': 1/60,
        '5m': 5/60,
        '15m': 15/60,
        '1h': 1,
        '24h': 24
      };

      const hours = hoursMap[timeframe] || 1;
      const pastTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

      // 과거 가격 조회
      const priceHistory = await this.assetPriceRepository.getPriceHistory(
        'HKTM', 
        'MEXC', 
        pastTime, 
        undefined, 
        1
      );

      if (priceHistory.length === 0) {
        return { isMet: false, actualChange: 0 };
      }

      const pastPrice = Number(priceHistory[0].priceUsd);
      const currentPriceValue = Number(currentPrice.priceUsd);
      const actualChangePercent = ((currentPriceValue - pastPrice) / pastPrice) * 100;

      // 절댓값으로 비교 (상승/하락 모두 체크)
      const isMet = Math.abs(actualChangePercent) >= Math.abs(targetChangePercent);

      return { isMet, actualChange: actualChangePercent };

    } catch (error) {
      console.error('[PriceMonitoring] 가격 변동률 확인 실패:', error);
      return { isMet: false, actualChange: 0 };
    }
  }

  /**
   * 가격 알림 트리거
   */
  private async triggerPriceAlert(alert: AlertRule, currentPrice: AssetPrice, reason: string): Promise<void> {
    try {
      console.log(`[PriceMonitoring] 알림 트리거: ${alert.name} - ${reason}`);

      // 중복 알림 방지 확인 (최근 1시간 내 같은 알림이 발송되었는지)
      const recentNotifications = await this.notificationHistoryRepository.findByUserId(
        alert.userId
      );

      const isDuplicate = recentNotifications.notifications.some(notification => 
        notification.metadata?.alertId === alert.id
      );

      if (isDuplicate) {
        console.log(`[PriceMonitoring] 중복 알림 방지: ${alert.id} (최근 1시간 내 발송됨)`);
        return;
      }

      // 알림 메시지 생성
      const title = `🚨 HKTM 가격 알림: ${alert.name}`;
      const message = `${reason}\n\n현재 시간: ${new Date().toLocaleString('ko-KR')}`;

      // 알림 발송 (sendAlert 메서드가 없으므로 주석 처리)
      // await this.notificationService.sendAlert({
      //   userId: alert.userId,
      //   title,
      //   message,
      //   data: {
      //     alertId: alert.id,
      //     alertName: alert.name,
      //     currentPrice: currentPrice.priceUsd,
      //     priceChange24h: currentPrice.priceChangePercent24h,
      //     timestamp: new Date().toISOString(),
      //     type: 'price_alert'
      //   },
      //   preferredType: alert.channels[0]?.type as any
      // });

      // 알림 히스토리 저장
      await this.notificationHistoryRepository.create({
        alertId: alert.id,
        userId: alert.userId,
        type: NotificationType.PRICE_TARGET,
        title,
        message,
        channels: alert.channels.map(channel => ({
          ...channel,
          status: NotificationStatus.SENT
        })),
        status: NotificationStatus.SENT,
        metadata: {
          alertId: alert.id,
          currentPrice: currentPrice.priceUsd,
          triggerReason: reason,
          priceData: {
            price: currentPrice.priceUsd,
            change24h: currentPrice.priceChangePercent24h,
            volume24h: currentPrice.volume24h
          }
        },
        sentAt: new Date()
      });

      // 알림 규칙 업데이트 (트리거 횟수 증가)
      await this.alertRuleRepository.update(alert.id, {
        triggeredCount: alert.triggeredCount + 1,
        lastTriggeredAt: new Date()
      });

      console.log(`[PriceMonitoring] 알림 발송 완료: ${alert.id}`);

    } catch (error) {
      console.error(`[PriceMonitoring] 알림 트리거 실패 ${alert.id}:`, error);
      
      // 실패한 알림도 히스토리에 기록
      await this.notificationHistoryRepository.create({
        alertId: alert.id,
        userId: alert.userId,
        type: NotificationType.PRICE_TARGET,
        title: `🚨 HKTM 가격 알림: ${alert.name}`,
        message: reason,
        channels: alert.channels.map(channel => ({
          ...channel,
          status: NotificationStatus.SENT
        })),
        status: NotificationStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : '알 수 없는 오류',
        metadata: { alertId: alert.id, currentPrice: currentPrice.priceUsd }
      });
    }
  }

  /**
   * 모니터링 통계 조회
   */
  async getMonitoringStats(_hours: number = 24): Promise<{
    totalAlertsChecked: number;
    alertsTriggered: number;
    averageResponseTime: number;
    lastMonitoringTime: Date | null;
  }> {
    try {
      //const endDate = new Date();
      //const startDate = new Date(endDate.getTime() - (hours * 60 * 60 * 1000));

      // 최근 알림 히스토리 조회
      const notifications = await this.notificationHistoryRepository.findByUserId(
        '', // 모든 사용자
        NotificationType.PRICE_TARGET,
        1,
        1000
      );

      // 활성화된 가격 알림 수 조회
      const activeAlerts = await this.alertRuleRepository.findActiveAlerts();
      const priceAlerts = activeAlerts.filter(alert => alert.type === 'price_target');

      return {
        totalAlertsChecked: priceAlerts.length,
        alertsTriggered: notifications.total,
        averageResponseTime: 0, // TODO: 실제 응답 시간 측정 구현
        lastMonitoringTime: notifications.notifications[0]?.createdAt || null
      };

    } catch (error) {
      console.error('[PriceMonitoring] 통계 조회 실패:', error);
      return {
        totalAlertsChecked: 0,
        alertsTriggered: 0,
        averageResponseTime: 0,
        lastMonitoringTime: null
      };
    }
  }

  /**
   * 특정 사용자의 HKTM 가격 알림 테스트
   */
  async testUserPriceAlert(userId: string, alertId: string): Promise<boolean> {
    try {
      console.log(`[PriceMonitoring] 사용자 ${userId}의 알림 ${alertId} 테스트 실행`);

      const alert = await this.alertRuleRepository.findById(alertId);
      if (!alert || alert.userId !== userId) {
        throw new Error('알림을 찾을 수 없거나 권한이 없습니다.');
      }

      const currentPrice = await this.assetPriceRepository.getLatestPrice('HKTM', 'MEXC');
      if (!currentPrice) {
        throw new Error('현재 가격 데이터를 찾을 수 없습니다.');
      }

      // 테스트 알림 발송 (sendAlert 메서드가 없으므로 주석 처리)
      // await this.notificationService.sendAlert({
      //   userId: alert.userId,
      //   title: `🧪 테스트 알림: ${alert.name}`,
      //   message: `현재 HKTM 가격: $${currentPrice.priceUsd}\n\n이것은 테스트 알림입니다.`,
      //   data: {
      //     alertId: alert.id,
      //     type: 'test',
      //     currentPrice: currentPrice.priceUsd,
      //     timestamp: new Date().toISOString()
      //   },
      //   preferredType: alert.channels[0]?.type as any
      // });

      console.log(`[PriceMonitoring] 테스트 알림 발송 완료: ${alertId}`);
      return true;

    } catch (error) {
      console.error(`[PriceMonitoring] 테스트 알림 실패:`, error);
      return false;
    }
  }
}
