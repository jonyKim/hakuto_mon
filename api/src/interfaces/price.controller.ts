import { Request, Response } from 'express';
import { AssetPriceRepository } from '../infrastructure/repositories/asset_price.repository';
import { PriceCollectionService } from '../application/price_collection.service';
import { PriceMonitoringService } from '../application/price_monitoring.service';
import { MexcService } from '../infrastructure/services/mexc.service';
import { schedulerManager } from '../infrastructure/schedulers/scheduler.manager';

export class PriceController {
  private assetPriceRepository: AssetPriceRepository;
  private priceCollectionService: PriceCollectionService;
  private mexcService: MexcService;

  constructor() {
    this.assetPriceRepository = new AssetPriceRepository();
    this.mexcService = new MexcService();
    this.priceCollectionService = new PriceCollectionService(
      this.mexcService,
      this.assetPriceRepository
    );
  }

  /**
   * HKTM 현재 가격 조회
   * GET /api/price/hktm/current
   */
  async getCurrentHktmPrice(req: Request, res: Response): Promise<void> {
    try {
      const latestPrice = await this.assetPriceRepository.getLatestPrice('HKTM', 'MEXC');
      
      if (!latestPrice) {
        res.status(404).json({
          success: false,
          message: 'HKTM 가격 데이터를 찾을 수 없습니다.',
          data: null
        });
        return;
      }

      res.json({
        success: true,
        message: 'HKTM 현재 가격 조회 성공',
        data: {
          symbol: latestPrice.symbol,
          price: Number(latestPrice.priceUsd),
          priceChange24h: Number(latestPrice.priceChange24h || 0),
          priceChangePercent24h: Number(latestPrice.priceChangePercent24h || 0),
          volume24h: Number(latestPrice.volume24h || 0),
          high24h: Number(latestPrice.high24h || 0),
          low24h: Number(latestPrice.low24h || 0),
          exchange: latestPrice.exchange,
          lastUpdated: latestPrice.createdAt,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('[PriceController] 현재 가격 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '가격 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * HKTM 가격 히스토리 조회
   * GET /api/price/hktm/history?period=24h&limit=100
   */
  async getHktmPriceHistory(req: Request, res: Response): Promise<void> {
    try {
      const { period = '24h', limit = '100' } = req.query;
      
      // 기간 파싱
      const periodHours = this.parsePeriod(period as string);
      const limitNum = Math.min(parseInt(limit as string) || 100, 1000); // 최대 1000개
      
      const startDate = new Date(Date.now() - (periodHours * 60 * 60 * 1000));
      const endDate = new Date();

      const priceHistory = await this.assetPriceRepository.getPriceHistory(
        'HKTM',
        'MEXC',
        startDate,
        endDate,
        limitNum
      );

      // 데이터 포맷팅
      const formattedHistory = priceHistory.map(price => ({
        price: Number(price.priceUsd),
        priceChange24h: Number(price.priceChange24h || 0),
        priceChangePercent24h: Number(price.priceChangePercent24h || 0),
        volume24h: Number(price.volume24h || 0),
        high24h: Number(price.high24h || 0),
        low24h: Number(price.low24h || 0),
        timestamp: price.createdAt
      }));

      res.json({
        success: true,
        message: 'HKTM 가격 히스토리 조회 성공',
        data: {
          symbol: 'HKTM',
          period: period,
          count: formattedHistory.length,
          history: formattedHistory
        }
      });

    } catch (error) {
      console.error('[PriceController] 가격 히스토리 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '가격 히스토리 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * HKTM 가격 통계 조회
   * GET /api/price/hktm/stats?period=24h
   */
  async getHktmPriceStats(req: Request, res: Response): Promise<void> {
    try {
      const { period = '24h' } = req.query;
      const periodHours = this.parsePeriod(period as string);

      const stats = await this.assetPriceRepository.getPriceStats('HKTM', 'MEXC', periodHours);
      
      if (!stats) {
        res.status(404).json({
          success: false,
          message: '해당 기간의 가격 데이터가 없습니다.',
          data: null
        });
        return;
      }

      res.json({
        success: true,
        message: 'HKTM 가격 통계 조회 성공',
        data: {
          symbol: 'HKTM',
          period: period,
          periodHours: periodHours,
          current: stats.current,
          high: stats.high,
          low: stats.low,
          average: stats.average,
          change: stats.change,
          changePercent: stats.changePercent,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('[PriceController] 가격 통계 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '가격 통계 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 수동 가격 업데이트
   * POST /api/price/hktm/update
   */
  async manualPriceUpdate(req: Request, res: Response): Promise<void> {
    try {
      console.log('[PriceController] 수동 가격 업데이트 요청');

      const result = await this.priceCollectionService.manualPriceUpdate();
      
      if (!result) {
        res.status(500).json({
          success: false,
          message: '가격 업데이트에 실패했습니다.',
          data: null
        });
        return;
      }

      res.json({
        success: true,
        message: 'HKTM 가격 업데이트 성공',
        data: {
          id: result.id,
          symbol: result.symbol,
          price: Number(result.priceUsd),
          priceChange24h: Number(result.priceChange24h || 0),
          priceChangePercent24h: Number(result.priceChangePercent24h || 0),
          volume24h: Number(result.volume24h || 0),
          exchange: result.exchange,
          updatedAt: result.createdAt
        }
      });

    } catch (error) {
      console.error('[PriceController] 수동 가격 업데이트 실패:', error);
      res.status(500).json({
        success: false,
        message: '가격 업데이트 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 가격 수집 상태 조회
   * GET /api/price/collection/status
   */
  async getCollectionStatus(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.priceCollectionService.checkCollectionHealth();
      const stats = await this.priceCollectionService.getCollectionStats(24);

      res.json({
        success: true,
        message: '가격 수집 상태 조회 성공',
        data: {
          health: {
            isHealthy: health.isHealthy,
            lastCollection: health.lastCollection,
            mexcApiStatus: health.mexcApiStatus,
            errorMessage: health.errorMessage
          },
          stats: {
            totalCollections: stats.totalCollections,
            successRate: stats.successRate,
            averagePrice: stats.averagePrice,
            priceRange: stats.priceRange,
            lastUpdate: stats.lastUpdate
          },
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('[PriceController] 수집 상태 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '수집 상태 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 스케줄러 상태 조회
   * GET /api/price/scheduler/status
   */
  async getSchedulerStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = schedulerManager.getOverallStatus();
      const health = await schedulerManager.healthCheck();

      res.json({
        success: true,
        message: '스케줄러 상태 조회 성공',
        data: {
          status,
          health,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('[PriceController] 스케줄러 상태 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '스케줄러 상태 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 스케줄러 수동 실행
   * POST /api/price/scheduler/execute
   */
  async executeScheduler(req: Request, res: Response): Promise<void> {
    try {
      const { type = 'both' } = req.body;
      
      if (!['collection', 'monitoring', 'both'].includes(type)) {
        res.status(400).json({
          success: false,
          message: '유효하지 않은 실행 타입입니다. (collection, monitoring, both)',
          data: null
        });
        return;
      }

      await schedulerManager.executeManually(type);

      res.json({
        success: true,
        message: `스케줄러 수동 실행 완료: ${type}`,
        data: {
          executedType: type,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('[PriceController] 스케줄러 수동 실행 실패:', error);
      res.status(500).json({
        success: false,
        message: '스케줄러 실행 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * MEXC API 상태 확인
   * GET /api/price/mexc/status
   */
  async getMexcApiStatus(req: Request, res: Response): Promise<void> {
    try {
      const configuration = this.mexcService.getConfiguration();
      const isHealthy = await this.mexcService.checkApiHealth();
      const serverTime = isHealthy ? await this.mexcService.getServerTime() : null;
      const symbolInfo = isHealthy ? await this.mexcService.getSymbolInfo() : null;

      res.json({
        success: true,
        message: 'MEXC API 상태 확인 완료',
        data: {
          configuration: {
            baseUrl: configuration.baseUrl,
            symbol: configuration.symbol,
            hasApiCredentials: configuration.hasApiCredentials
          },
          isHealthy,
          serverTime,
          symbolInfo,
          localTime: new Date(),
          timeDiff: serverTime ? Math.abs(Date.now() - serverTime.getTime()) : null
        }
      });

    } catch (error) {
      console.error('[PriceController] MEXC API 상태 확인 실패:', error);
      res.status(500).json({
        success: false,
        message: 'MEXC API 상태 확인 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 기간 문자열을 시간으로 변환
   */
  private parsePeriod(period: string): number {
    const periodMap: { [key: string]: number } = {
      '1h': 1,
      '4h': 4,
      '12h': 12,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    };

    return periodMap[period] || 24; // 기본값 24시간
  }
}
