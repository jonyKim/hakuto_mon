import { MexcService, HktmPriceData } from '../infrastructure/services/mexc.service';
import { AssetPriceRepository } from '../infrastructure/repositories/asset_price.repository';
import { AssetPrice } from '../domain/entities/asset_price.entity';

export class PriceCollectionService {
  constructor(
    private mexcService: MexcService,
    private assetPriceRepository: AssetPriceRepository
  ) {}

  /**
   * HKTM 가격 수집 및 저장
   */
  async collectHktmPrice(): Promise<AssetPrice | null> {
    try {
      console.log('[PriceCollection] HKTM 가격 수집 시작...');
      
      // MEXC API에서 HKTM 가격 조회
      const priceData = await this.mexcService.getHktmPrice();
      console.log('[PriceCollection] MEXC에서 가격 조회 완료:', {
        price: priceData.price,
        change24h: priceData.priceChangePercent24h,
        volume: priceData.volume24h
      });

      // 가격 데이터 유효성 검사
      if (!priceData.price || isNaN(priceData.price) || priceData.price <= 0) {
        console.warn('[PriceCollection] 유효하지 않은 가격 데이터, 저장 건너뜀:', {
          price: priceData.price,
          isNaN: isNaN(priceData.price)
        });
        return null;
      }

      // 추가 데이터 유효성 검사
      const validPriceData = {
        symbol: priceData.symbol,
        priceUsd: isNaN(priceData.price) ? 0 : priceData.price,
        priceChange24h: isNaN(priceData.priceChange24h) ? 0 : priceData.priceChange24h,
        priceChangePercent24h: isNaN(priceData.priceChangePercent24h) ? 0 : priceData.priceChangePercent24h,
        volume24h: isNaN(priceData.volume24h) ? 0 : priceData.volume24h,
        high24h: isNaN(priceData.high24h) ? priceData.price : priceData.high24h,
        low24h: isNaN(priceData.low24h) ? priceData.price : priceData.low24h,
        exchange: 'MEXC',
        lastUpdatedAt: priceData.timestamp,
        createdAt: new Date()
      };

      console.log('[PriceCollection] 정제된 가격 데이터:', validPriceData);

      // 데이터베이스에 저장
      const assetPrice = await this.assetPriceRepository.upsertPrice(validPriceData);

      console.log('[PriceCollection] 가격 데이터 저장 완료:', assetPrice.id);
      return assetPrice;

    } catch (error) {
      console.error('[PriceCollection] HKTM 가격 수집 실패:', error);
      
      // 에러 로깅을 위한 추가 정보
      if (error instanceof Error) {
        console.error('[PriceCollection] Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      
      return null;
    }
  }

  /**
   * 가격 수집 상태 확인
   */
  async checkCollectionHealth(): Promise<{
    isHealthy: boolean;
    lastCollection?: Date;
    mexcApiStatus: boolean;
    errorMessage?: string;
  }> {
    try {
      // MEXC API 상태 확인
      const mexcApiStatus = await this.mexcService.checkApiHealth();
      
      // 최근 가격 데이터 확인
      const latestPrice = await this.assetPriceRepository.getLatestPrice('HKTM', 'MEXC');
      
      // 최근 5분 이내에 데이터가 있는지 확인
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const isRecentDataAvailable = latestPrice && latestPrice.createdAt > fiveMinutesAgo;
      return {
        isHealthy: mexcApiStatus && (isRecentDataAvailable ?? false),
        lastCollection: latestPrice?.createdAt,
        mexcApiStatus,
        errorMessage: !mexcApiStatus ? 'MEXC API 연결 실패' : 
                     !isRecentDataAvailable ? '최근 가격 데이터 없음' : undefined
      };

    } catch (error) {
      console.error('[PriceCollection] 상태 확인 실패:', error);
      return {
        isHealthy: false,
        mexcApiStatus: false,
        errorMessage: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * 가격 수집 통계 조회
   */
  async getCollectionStats(hours: number = 24): Promise<{
    totalCollections: number;
    successRate: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
    lastUpdate: Date | null;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (hours * 60 * 60 * 1000));

      const priceHistory = await this.assetPriceRepository.getPriceHistory(
        'HKTM', 
        'MEXC', 
        startDate, 
        endDate, 
        1000
      );

      if (priceHistory.length === 0) {
        return {
          totalCollections: 0,
          successRate: 0,
          averagePrice: 0,
          priceRange: { min: 0, max: 0 },
          lastUpdate: null
        };
      }

      const prices = priceHistory.map(p => Number(p.priceUsd));
      const totalCollections = priceHistory.length;
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      // 성공률 계산 (예상 수집 횟수 대비 실제 수집 횟수)
      const expectedCollections = hours * 60; // 1분마다 수집
      const successRate = (totalCollections / expectedCollections) * 100;

      return {
        totalCollections,
        successRate: Math.min(successRate, 100), // 100% 초과 방지
        averagePrice,
        priceRange: { min: minPrice, max: maxPrice },
        lastUpdate: priceHistory[0].createdAt
      };

    } catch (error) {
      console.error('[PriceCollection] 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 가격 데이터 정리 (오래된 데이터 삭제)
   */
  async cleanupOldData(daysToKeep: number = 30): Promise<number> {
    try {
      console.log(`[PriceCollection] ${daysToKeep}일 이전 데이터 정리 시작...`);
      
      const deletedCount = await this.assetPriceRepository.cleanupOldPrices(daysToKeep);
      
      console.log(`[PriceCollection] ${deletedCount}개 레코드 삭제 완료`);
      return deletedCount;

    } catch (error) {
      console.error('[PriceCollection] 데이터 정리 실패:', error);
      throw error;
    }
  }

  /**
   * 수동 가격 업데이트 (테스트용)
   */
  async manualPriceUpdate(): Promise<AssetPrice | null> {
    console.log('[PriceCollection] 수동 가격 업데이트 실행...');
    return await this.collectHktmPrice();
  }

  /**
   * 가격 수집 재시도 로직
   */
  async collectWithRetry(maxRetries: number = 3, delayMs: number = 5000): Promise<AssetPrice | null> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[PriceCollection] 가격 수집 시도 ${attempt}/${maxRetries}`);
        
        const result = await this.collectHktmPrice();
        if (result) {
          console.log(`[PriceCollection] ${attempt}번째 시도에서 성공`);
          return result;
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`[PriceCollection] ${attempt}번째 시도 실패:`, lastError.message);
        
        if (attempt < maxRetries) {
          console.log(`[PriceCollection] ${delayMs}ms 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    console.error(`[PriceCollection] ${maxRetries}번 시도 후 최종 실패`);
    if (lastError) {
      throw lastError;
    }
    
    return null;
  }
}
