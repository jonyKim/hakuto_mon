import { Request, Response } from 'express';
import { SwapAnalyticsService } from '../application/swap_analytics.service';

export class SwapAnalyticsController {
  private swapAnalyticsService: SwapAnalyticsService;

  constructor() {
    this.swapAnalyticsService = new SwapAnalyticsService();
  }

  // SWAP 요약 통계
  async getSwapSummary(req: Request, res: Response) {
    try {
      const summary = await this.swapAnalyticsService.getSwapSummary();
      
      res.json({
        success: true,
        message: 'SWAP 요약 통계를 성공적으로 조회했습니다.',
        data: summary
      });
    } catch (error) {
      console.error('SWAP 요약 통계 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: 'SWAP 요약 통계 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // SWAP 트랜잭션 조회
  async getSwapTransactions(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const transactions = await this.swapAnalyticsService.getSwapTransactions(limit);
      
      res.json({
        success: true,
        message: 'SWAP 트랜잭션을 성공적으로 조회했습니다.',
        data: transactions
      });
    } catch (error) {
      console.error('SWAP 트랜잭션 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: 'SWAP 트랜잭션 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // SWAP 트렌드 조회
  async getSwapTrends(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const trends = await this.swapAnalyticsService.getSwapTrends(days);
      
      res.json({
        success: true,
        message: 'SWAP 트렌드를 성공적으로 조회했습니다.',
        data: trends
      });
    } catch (error) {
      console.error('SWAP 트렌드 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: 'SWAP 트렌드 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 상위 SWAP 사용자 조회
  async getTopSwappers(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const topSwappers = await this.swapAnalyticsService.getTopSwappers(limit);
      
      res.json({
        success: true,
        message: '상위 SWAP 사용자를 성공적으로 조회했습니다.',
        data: topSwappers
      });
    } catch (error) {
      console.error('상위 SWAP 사용자 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '상위 SWAP 사용자 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // SWAP 분포 조회
  async getSwapDistribution(_req: Request, res: Response) {
    try {
      const distribution = await this.swapAnalyticsService.getSwapDistribution();
      
      res.json({
        success: true,
        message: 'SWAP 분포를 성공적으로 조회했습니다.',
        data: distribution
      });
    } catch (error) {
      console.error('SWAP 분포 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: 'SWAP 분포 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // SWAP 사용자 상세 정보 조회
  async getSwapperDetails(req: Request, res: Response) {
    try {
      const { address } = req.params;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          message: '주소가 필요합니다.'
        });
      }

      const details = await this.swapAnalyticsService.getSwapperDetails(address);
      
      if (!details) {
        return res.status(404).json({
          success: false,
          message: '해당 주소의 SWAP 내역을 찾을 수 없습니다.'
        });
      }
      
      res.json({
        success: true,
        message: 'SWAP 사용자 상세 정보를 성공적으로 조회했습니다.',
        data: details
      });
    } catch (error) {
      console.error('SWAP 사용자 상세 정보 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: 'SWAP 사용자 상세 정보 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
