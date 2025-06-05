import { DashboardRepository } from '../infrastructure/dashboard.repository';
import { DashboardOverview, DashboardStats, StakingTrend, RewardTrend } from '../types/dashboard';

export class DashboardService {
    constructor(
        private readonly dashboardRepository: DashboardRepository
    ) {}

    async getDashboardOverview(startDate: Date, endDate: Date): Promise<DashboardOverview> {
        const [
            stats,
            stakingTrends,
            rewardTrends
        ] = await Promise.all([
            this.getDashboardStats(startDate, endDate),
            this.dashboardRepository.getStakingTrends(startDate, endDate),
            this.dashboardRepository.getRewardTrends(startDate, endDate)
        ]);

        return {
            stats,
            staking_trends: stakingTrends,
            reward_trends: rewardTrends
        };
    }

    async getDashboardStats(startDate: Date, endDate: Date): Promise<DashboardStats> {
        const [
            totalNFTs,
            totalStaked,
            totalRewards,
            stakingStats,
            todayWithdrawn
        ] = await Promise.all([
            this.dashboardRepository.getTotalNFTs(startDate, endDate),
            this.dashboardRepository.getTotalStaked(startDate, endDate),
            this.dashboardRepository.getTotalRewards(startDate, endDate),
            this.dashboardRepository.getStakingStats(startDate, endDate),
            this.dashboardRepository.getTodayWithdrawn()
        ]);

        return {
            total_nfts: totalNFTs.total_nfts,
            total_nfts_change: totalNFTs.change_percentage,
            total_staked: totalStaked.amount,
            total_staked_change: totalStaked.change_percentage,
            total_rewards: totalRewards.amount,
            total_rewards_change: totalRewards.change_percentage,
            staking_stats: stakingStats,
            today_withdrawn: todayWithdrawn
        };
    }

    async getStakingTrends(startDate: Date, endDate: Date): Promise<StakingTrend[]> {
        return this.dashboardRepository.getStakingTrends(startDate, endDate);
    }

    async getRewardTrends(startDate: Date, endDate: Date): Promise<RewardTrend[]> {
        return this.dashboardRepository.getRewardTrends(startDate, endDate);
    }

    async getTotalStakedAmountAllTime(): Promise<number> {
        return this.dashboardRepository.getTotalStakedAmountAllTime();
    }

    async getStakedAmountByAddress(): Promise<{ wallet_address: string, total_staked: number }[]> {
        return this.dashboardRepository.getStakedAmountByAddress();
    }

    async getFailedTransactionCount(): Promise<number> {
        return this.dashboardRepository.getFailedTransactionCount();
    }

    async getDailyStakingStats(startDate: Date, endDate: Date): Promise<{ date: string, count: number, total_staked: number }[]> {
        return this.dashboardRepository.getDailyStakingStats(startDate, endDate);
    }

    async getStakingStatsByDate(startDate: Date, endDate: Date): Promise<{ nft_type: string, count: number, total_staked: number }[]> {
        return this.dashboardRepository.getStakingStats(startDate, endDate);
    }
} 