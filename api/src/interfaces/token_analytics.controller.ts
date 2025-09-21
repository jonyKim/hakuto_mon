import { Request, Response } from 'express';
import { TokenAnalyticsService } from '../application/token_analytics.service';

export class TokenAnalyticsController {
  constructor(private tokenAnalyticsService: TokenAnalyticsService) {}

  // 토큰 홀더 요약 통계
  async getTokenHolderSummary(_req: Request, res: Response): Promise<void> {
    try {
      const summary = await this.tokenAnalyticsService.getTokenHolderSummary();
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('토큰 홀더 요약 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '토큰 홀더 요약 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 상위 토큰 홀더 조회
  async getTopTokenHolders(req: Request, res: Response): Promise<void> {
    try {
      const { tokenVersion, limit } = req.query;
      const topHolders = await this.tokenAnalyticsService.getTopTokenHolders(
        tokenVersion as string,
        limit ? parseInt(limit as string) : 50
      );
      
      res.json({
        success: true,
        data: topHolders
      });
    } catch (error) {
      console.error('상위 토큰 홀더 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '상위 토큰 홀더 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 최근 토큰 트랜잭션 조회
  async getRecentTokenTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;
      const transactions = await this.tokenAnalyticsService.getRecentTokenTransactions(
        limit ? parseInt(limit as string) : 100
      );
      
      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('최근 토큰 트랜잭션 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '최근 토큰 트랜잭션 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 마이그레이션 상태 분석
  async getMigrationStatus(_req: Request, res: Response): Promise<void> {
    try {
      const migrationStatus = await this.tokenAnalyticsService.getMigrationStatus();
      res.json({
        success: true,
        data: migrationStatus
      });
    } catch (error) {
      console.error('마이그레이션 상태 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '마이그레이션 상태 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 토큰 분포 분석
  async getTokenDistribution(_req: Request, res: Response): Promise<void> {
    try {
      const distribution = await this.tokenAnalyticsService.getTokenDistribution();
      res.json({
        success: true,
        data: distribution
      });
    } catch (error) {
      console.error('토큰 분포 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '토큰 분포 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 일별 토큰 통계
  async getDailyTokenStats(_req: Request, res: Response): Promise<void> {
    try {
      const dailyStats = await this.tokenAnalyticsService.getDailyTokenStats();
      res.json({
        success: true,
        data: dailyStats
      });
    } catch (error) {
      console.error('일별 토큰 통계 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '일별 토큰 통계 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 특정 홀더 상세 정보
  async getHolderDetails(req: Request, res: Response): Promise<void> {
    try {
      const { holderAddress } = req.params;
      
      if (!holderAddress) {
        res.status(400).json({
          success: false,
          message: '홀더 주소가 필요합니다.'
        });
        return;
      }
      
      const holderDetails = await this.tokenAnalyticsService.getHolderDetails(holderAddress);
      res.json({
        success: true,
        data: holderDetails
      });
    } catch (error) {
      console.error('홀더 상세 정보 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '홀더 상세 정보 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 토큰 통계 요약
  async getTokenStatsSummary(_req: Request, res: Response): Promise<void> {
    try {
      const summary = await this.tokenAnalyticsService.getTokenStatsSummary();
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('토큰 통계 요약 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '토큰 통계 요약 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
