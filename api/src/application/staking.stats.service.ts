import { StakingStatsRepository } from '../infrastructure/staking.stats.repository';

export class StakingStatsService {
  constructor(private readonly stakingStatsRepository: StakingStatsRepository) {}

  async getStakingSummary() {
    const [total_staked, by_admin, by_type, by_date, by_user_type] = await Promise.all([
      this.stakingStatsRepository.getTotalStaked(),
      this.stakingStatsRepository.getStakedByAdmin(),
      this.stakingStatsRepository.getStakedByType(),
      this.stakingStatsRepository.getStakedByDate(),
      this.stakingStatsRepository.getStakedByUserAndType()
    ]);

    // console.log('total_staked', total_staked);
    // console.log('by_admin', by_admin);
    // console.log('by_type', by_type);

    return {
      total_staked,
      by_admin,
      by_type,
      by_date,
      by_user_type
    };
  }
} 