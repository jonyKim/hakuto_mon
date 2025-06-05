import { RewardStatsRepository } from '../infrastructure/reward.stats.repository';

export class RewardStatsService {
  constructor(private readonly rewardStatsRepository: RewardStatsRepository) {}

  async getRewardSummary() {
    const [total_rewards, by_user, by_date, by_month, by_nft] = await Promise.all([
      this.rewardStatsRepository.getTotalRewards(),
      this.rewardStatsRepository.getRewardsByUser(),
      this.rewardStatsRepository.getRewardsByDate(),
      this.rewardStatsRepository.getRewardsByMonth(),
      this.rewardStatsRepository.getRewardsByNFTType()
    ]);

    // console.log('total_rewards', total_rewards);
    // console.log('by_user', by_user);
    // console.log('by_date', by_date);
    // console.log('by_month', by_month);
    // console.log('by_nft', by_nft);

    return {
      total_rewards,
      by_user,
      by_date,
      by_month,
      by_nft
    };
  }
} 