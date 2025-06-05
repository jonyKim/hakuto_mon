import { WithdrawStatsRepository } from '../infrastructure/withdraw.stats.repository';

export class WithdrawStatsService {
  constructor(private readonly withdrawStatsRepository: WithdrawStatsRepository) {}

  async getWithdrawSummary() {
    const [total_withdrawn, by_date, by_month, by_user, by_user_date] = await Promise.all([
      this.withdrawStatsRepository.getTotalWithdrawn(),
      this.withdrawStatsRepository.getWithdrawnByDate(),
      this.withdrawStatsRepository.getWithdrawnByMonth(),
      this.withdrawStatsRepository.getWithdrawnByUser(),
      this.withdrawStatsRepository.getWithdrawnByUserDate()
    ]);
    return {
      total_withdrawn,
      by_date,
      by_month,
      by_user,
      by_user_date
    };
  }
} 