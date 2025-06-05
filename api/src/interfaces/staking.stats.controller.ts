import { Request, Response } from 'express';
import { StakingStatsService } from '../application/staking.stats.service';

export class StakingStatsController {
  constructor(private readonly stakingStatsService: StakingStatsService) {}

  async getStakingSummary(_req: Request, res: Response) {
    try {
      const summary = await this.stakingStatsService.getStakingSummary();
      res.json(summary);
    } catch (error) {
      console.error('Error fetching staking summary:', error);
      res.status(500).json({ message: '스테이킹 통계 조회 중 오류가 발생했습니다.' });
    }
  }
} 