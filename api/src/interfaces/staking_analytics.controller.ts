import { Request, Response } from 'express';
import { StakingAnalyticsService } from '../application/staking_analytics.service';

export class StakingAnalyticsController {
  private stakingAnalyticsService: StakingAnalyticsService;

  constructor() {
    this.stakingAnalyticsService = new StakingAnalyticsService();
  }

  // 스테이킹 요약 통계
  async getStakingSummary(_req: Request, res: Response) {
    try {
      const summary = await this.stakingAnalyticsService.getStakingSummary();
      
      res.json({
        success: true,
        message: '스테이킹 요약 통계를 성공적으로 조회했습니다.',
        data: summary
      });
    } catch (error) {
      console.error('스테이킹 요약 통계 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '스테이킹 요약 통계 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 컬렉션별 스테이킹 통계
  async getCollectionStakingStats(_req: Request, res: Response) {
    try {
      const stats = await this.stakingAnalyticsService.getCollectionStakingStats();
      
      res.json({
        success: true,
        message: '컬렉션별 스테이킹 통계를 성공적으로 조회했습니다.',
        data: stats
      });
    } catch (error) {
      console.error('컬렉션별 스테이킹 통계 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '컬렉션별 스테이킹 통계 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 스테이킹 트랜잭션 조회
  async getStakingTransactions(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const collectionName = req.query.collection as string;
      const transactions = await this.stakingAnalyticsService.getStakingTransactions(limit, collectionName);
      
      res.json({
        success: true,
        message: '스테이킹 트랜잭션을 성공적으로 조회했습니다.',
        data: transactions
      });
    } catch (error) {
      console.error('스테이킹 트랜잭션 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '스테이킹 트랜잭션 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 상위 스테이커 조회
  async getTopStakers(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const topStakers = await this.stakingAnalyticsService.getTopStakers(limit);
      
      res.json({
        success: true,
        message: '상위 스테이커를 성공적으로 조회했습니다.',
        data: topStakers
      });
    } catch (error) {
      console.error('상위 스테이커 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '상위 스테이커 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 스테이킹 트렌드 조회
  async getStakingTrends(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const trends = await this.stakingAnalyticsService.getStakingTrends(days);
      
      res.json({
        success: true,
        message: '스테이킹 트렌드를 성공적으로 조회했습니다.',
        data: trends
      });
    } catch (error) {
      console.error('스테이킹 트렌드 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '스테이킹 트렌드 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 컬렉션별 활동 내역 조회
  async getCollectionActivity(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const activity = await this.stakingAnalyticsService.getCollectionActivity(days);
      
      res.json({
        success: true,
        message: '컬렉션별 활동 내역을 성공적으로 조회했습니다.',
        data: activity
      });
    } catch (error) {
      console.error('컬렉션별 활동 내역 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '컬렉션별 활동 내역 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 스테이커 상세 정보 조회
  async getStakerDetails(req: Request, res: Response): Promise<any> {
    try {
      const { address } = req.params;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          message: '주소가 필요합니다.'
        });
      }

      const details = await this.stakingAnalyticsService.getStakerDetails(address);
      
      if (!details || details.length === 0) {
        return res.status(404).json({
          success: false,
          message: '해당 주소의 스테이킹 내역을 찾을 수 없습니다.'
        });
      }
      
      res.json({
        success: true,
        message: '스테이커 상세 정보를 성공적으로 조회했습니다.',
        data: details
      });
    } catch (error) {
      console.error('스테이커 상세 정보 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '스테이커 상세 정보 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
