import { Request, Response } from 'express';
import { RewardStatsService } from '../application/reward.stats.service';

export class RewardStatsController {
  constructor(private readonly rewardStatsService: RewardStatsService) {}

  async getRewardSummary(_req: Request, res: Response) {
    try {
      const summary = await this.rewardStatsService.getRewardSummary();
      res.json(summary);
    } catch (error) {
      console.error('Error fetching reward summary:', error);
      res.status(500).json({ message: '리워드 통계 조회 중 오류가 발생했습니다.' });
    }
  }
} 