import { DashboardRepository } from '../infrastructure/dashboard.repository';
import { DashboardOverview, DashboardStats, RewardTrend, UserActivityTrend } from '../types/dashboard';
import { AdRewardRepository } from '../infrastructure/ad.rewards.repository';
import { MissionRewardRepository } from '../infrastructure/mission.rewards.repository';
import { MissionRewardStats } from 'mission';

export class DashboardService {
    constructor(
        private readonly dashboardRepository: DashboardRepository,
        private readonly adRewardRepository: AdRewardRepository,
        private readonly missionRewardRepository: MissionRewardRepository
    ) {}

    async getDashboardOverview(startDate: Date, endDate: Date): Promise<DashboardOverview> {
        const [
            stats,
            rewardTrends,
            userActivityTrends,
            recentMissionClaims,
            recentAdClaims
        ] = await Promise.all([
            this.getDashboardStats(startDate, endDate),
            this.dashboardRepository.getRewardTrends(startDate, endDate),
            this.dashboardRepository.getUserActivityTrends(startDate, endDate),
            this.missionRewardRepository.getRecentClaims(10),
            this.adRewardRepository.getRecentClaims(10)
        ]);

        return {
            stats,
            reward_trends: rewardTrends,
            user_activity_trends: userActivityTrends,
            recent_mission_claims: recentMissionClaims,
            recent_ad_claims: recentAdClaims
        };
    }

    async getDashboardStats(startDate: Date, endDate: Date): Promise<DashboardStats> {
        const [
            totalUsers,
            totalRewards,
            activeUsers,
            missionStats,
            adStats
        ] = await Promise.all([
            this.dashboardRepository.getTotalUsers(startDate, endDate),
            this.dashboardRepository.getTotalRewards(startDate, endDate),
            this.dashboardRepository.getActiveUsers(startDate, endDate),
            this.dashboardRepository.getMissionStats(startDate, endDate),
            this.dashboardRepository.getAdStats(startDate, endDate)
        ]);

        return {
            total_users: totalUsers.count,
            total_users_change: totalUsers.change_percentage,
            total_rewards: totalRewards.amount,
            total_rewards_change: totalRewards.change_percentage,
            active_users: activeUsers.count,
            active_users_change: activeUsers.change_percentage,
            mission_stats: missionStats,
            ad_stats: adStats
        };
    }

    async getRewardTrends(startDate: Date, endDate: Date): Promise<RewardTrend[]> {
        return this.dashboardRepository.getRewardTrends(startDate, endDate);
    }

    async getUserActivityTrends(startDate: Date, endDate: Date): Promise<UserActivityTrend[]> {
        return this.dashboardRepository.getUserActivityTrends(startDate, endDate);
    }

    async getTotalRewardAmountAllTime(): Promise<number> {
        return this.dashboardRepository.getTotalRewardAmountAllTime();
    }

    async getRewardAmountByAddress(): Promise<{ wallet_address: string, total_reward: number }[]> {
        return this.dashboardRepository.getRewardAmountByAddress();
    }

    async getFailedTransactionCount(): Promise<number> {
        return this.dashboardRepository.getFailedTransactionCount();
    }

    async getDailyTransactionStats(startDate: Date, endDate: Date): Promise<{ date: string, count: number, total_reward: number }[]> {
        return this.dashboardRepository.getDailyTransactionStats(startDate, endDate);
    }

    async getMissionStatsByDate(startDate: Date, endDate: Date): Promise<MissionRewardStats> {
        return this.dashboardRepository.getMissionStats(startDate, endDate);
    }
} 