import { Request, Response } from 'express';
import { WithdrawStatsService } from '../application/withdraw.stats.service';

export class WithdrawStatsController {
  constructor(private readonly withdrawStatsService: WithdrawStatsService) {}

  async getWithdrawSummary(_req: Request, res: Response) {
    try {
      const summary = await this.withdrawStatsService.getWithdrawSummary();
      res.json(summary);
    } catch (error) {
      console.error('Error fetching withdraw summary:', error);
      res.status(500).json({ message: '출금 통계 조회 중 오류가 발생했습니다.' });
    }
  }
} 