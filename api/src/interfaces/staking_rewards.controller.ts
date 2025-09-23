import { Request, Response } from 'express';
import { StakingRewardsService } from '../application/staking_rewards.service';

export class StakingRewardsController {
  private stakingRewardsService: StakingRewardsService;

  constructor() {
    this.stakingRewardsService = new StakingRewardsService();
  }

  // 스테이킹 보상 요약 통계
  async getStakingRewardSummary(_req: Request, res: Response) {
    try {
      const summary = await this.stakingRewardsService.getStakingRewardSummary();
      
      res.json({
        success: true,
        message: '스테이킹 보상 요약 통계를 성공적으로 조회했습니다.',
        data: summary
      });
    } catch (error) {
      console.error('스테이킹 보상 요약 통계 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '스테이킹 보상 요약 통계 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 스테이커별 보상 상세 정보
  async getStakerRewardDetails(req: Request, res: Response): Promise<any> {
    try {
      const { address } = req.params;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          message: '주소가 필요합니다.'
        });
      }

      const details = await this.stakingRewardsService.getStakerRewardDetails(address);
      
      if (!details) {
        return res.status(404).json({
          success: false,
          message: '해당 주소의 보상 내역을 찾을 수 없습니다.'
        });
      }
      
      res.json({
        success: true,
        message: '스테이커 보상 상세 정보를 성공적으로 조회했습니다.',
        data: details
      });
    } catch (error) {
      console.error('스테이커 보상 상세 정보 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '스테이커 보상 상세 정보 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 상위 보상 수령자 조회
  async getTopRewardRecipients(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const recipients = await this.stakingRewardsService.getTopRewardRecipients(limit);
      
      res.json({
        success: true,
        message: '상위 보상 수령자를 성공적으로 조회했습니다.',
        data: recipients
      });
    } catch (error) {
      console.error('상위 보상 수령자 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '상위 보상 수령자 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 보상 분배 내역 조회
  async getRewardDistribution(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const distribution = await this.stakingRewardsService.getRewardDistribution(days);
      
      res.json({
        success: true,
        message: '보상 분배 내역을 성공적으로 조회했습니다.',
        data: distribution
      });
    } catch (error) {
      console.error('보상 분배 내역 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '보상 분배 내역 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 컬렉션별 보상 통계 조회
  async getCollectionRewardStats(_req: Request, res: Response) {
    try {
      const stats = await this.stakingRewardsService.getCollectionRewardStats();
      
      res.json({
        success: true,
        message: '컬렉션별 보상 통계를 성공적으로 조회했습니다.',
        data: stats
      });
    } catch (error) {
      console.error('컬렉션별 보상 통계 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '컬렉션별 보상 통계 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 최근 보상 트랜잭션 조회
  async getRecentRewardTransactions(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const transactions = await this.stakingRewardsService.getRecentRewardTransactions(limit);
      
      res.json({
        success: true,
        message: '최근 보상 트랜잭션을 성공적으로 조회했습니다.',
        data: transactions
      });
    } catch (error) {
      console.error('최근 보상 트랜잭션 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '최근 보상 트랜잭션 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
