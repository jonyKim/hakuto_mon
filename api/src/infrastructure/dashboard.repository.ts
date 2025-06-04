import { supabase } from './supabase';
import { RewardTrend, UserActivityTrend } from '../types/dashboard';
import { AdRewardStats } from '../types/ad';
import { MissionRewardStats } from '../types/mission';

export class DashboardRepository {
    async getTotalUsers(startDate: Date, endDate: Date): Promise<{ count: number; change_percentage: number }> {
        const [currentCount, previousCount] = await Promise.all([
            this.getUserCount(startDate, endDate),
            this.getUserCount(
                new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
                startDate
            )
        ]);

        return {
            count: currentCount,
            change_percentage: this.calculateChangePercentage(currentCount, previousCount)
        };
    }

    async getTotalRewards(startDate: Date, endDate: Date): Promise<{ amount: number; change_percentage: number }> {
        const [currentAmount, previousAmount] = await Promise.all([
            this.getTotalRewardAmount(startDate, endDate),
            this.getTotalRewardAmount(
                new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
                startDate
            )
        ]);

        return {
            amount: currentAmount,
            change_percentage: this.calculateChangePercentage(currentAmount, previousAmount)
        };
    }

    async getActiveUsers(startDate: Date, endDate: Date): Promise<{ count: number; change_percentage: number }> {
        const [currentCount, previousCount] = await Promise.all([
            this.getActiveUserCount(startDate, endDate),
            this.getActiveUserCount(
                new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
                startDate
            )
        ]);

        return {
            count: currentCount,
            change_percentage: this.calculateChangePercentage(currentCount, previousCount)
        };
    }

    async getMissionStats(startDate: Date, endDate: Date): Promise<MissionRewardStats> {
        const { data, error } = await supabase
            .from('mission_reward_claims')
            .select('claim_status, reward_amount')
            .gte('claimed_at', startDate.toISOString())
            .lte('claimed_at', endDate.toISOString());

        if (error) throw error;

        return {
            total_claims: data.length,
            total_rewards: data.reduce((sum, claim) => sum + (claim.reward_amount || 0), 0),
            completed_claims: data.filter(claim => claim.claim_status === 'COMPLETED').length,
            failed_claims: data.filter(claim => claim.claim_status === 'FAILED').length
        };
    }

    async getAdStats(startDate: Date, endDate: Date): Promise<AdRewardStats> {
        const { data, error } = await supabase
            .from('ad_reward_claims')
            .select('user_id, claim_status, reward_amount')
            .gte('claimed_at', startDate.toISOString())
            .lte('claimed_at', endDate.toISOString());

        if (error) throw error;

        const uniqueUsers = new Set(data.map(claim => claim.user_id)).size;
        const totalRewards = data.reduce((sum, claim) => sum + (claim.reward_amount || 0), 0);

        return {
            total_views: data.length,
            unique_users: uniqueUsers,
            total_rewards: totalRewards,
            avg_reward: data.length > 0 ? totalRewards / data.length : 0,
            completed_claims: data.filter(claim => claim.claim_status === 'COMPLETED').length,
            failed_claims: data.filter(claim => claim.claim_status === 'FAILED').length
        };
    }

    async getRewardTrends(startDate: Date, endDate: Date): Promise<RewardTrend[]> {
        const [missionClaims, adClaims] = await Promise.all([
            this.getDailyMissionRewards(startDate, endDate),
            this.getDailyAdRewards(startDate, endDate)
        ]);

        const trends: RewardTrend[] = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const missionRewards = missionClaims[dateStr] || 0;
            const adRewards = adClaims[dateStr] || 0;

            trends.push({
                date: dateStr,
                mission_rewards: missionRewards,
                ad_rewards: adRewards,
                total_rewards: missionRewards + adRewards
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return trends;
    }

    async getUserActivityTrends(startDate: Date, endDate: Date): Promise<UserActivityTrend[]> {
        const [missionUsers, adUsers, activeUsers] = await Promise.all([
            this.getDailyMissionUsers(startDate, endDate),
            this.getDailyAdUsers(startDate, endDate),
            this.getDailyActiveUsers(startDate, endDate)
        ]);

        const trends: UserActivityTrend[] = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            
            trends.push({
                date: dateStr,
                mission_participants: missionUsers[dateStr] || 0,
                ad_viewers: adUsers[dateStr] || 0,
                active_users: activeUsers[dateStr] || 0
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return trends;
    }

    private async getUserCount(startDate: Date, endDate: Date): Promise<number> {
        const { count, error } = await supabase
            .from('users')
            .select('id', { count: 'exact' })
            .gte('created_at', startDate.toISOString())
            .lt('created_at', endDate.toISOString());

        if (error) throw error;
        return count || 0;
    }

    private async getTotalRewardAmount(startDate: Date, endDate: Date): Promise<number> {
        const [missionRewards, adRewards] = await Promise.all([
            this.getMissionRewardAmount(startDate, endDate),
            this.getAdRewardAmount(startDate, endDate)
        ]);

        return missionRewards + adRewards;
    }

    private async getMissionRewardAmount(startDate: Date, endDate: Date): Promise<number> {
        const { data, error } = await supabase
            .from('mission_reward_claims')
            .select('reward_amount')
            .eq('claim_status', 'COMPLETED')
            .gte('claimed_at', startDate.toISOString())
            .lt('claimed_at', endDate.toISOString());

        if (error) throw error;
        return data.reduce((sum, claim) => sum + (claim.reward_amount || 0), 0);
    }

    private async getAdRewardAmount(startDate: Date, endDate: Date): Promise<number> {
        const { data, error } = await supabase
            .from('ad_reward_claims')
            .select('reward_amount')
            .eq('claim_status', 'COMPLETED')
            .gte('claimed_at', startDate.toISOString())
            .lt('claimed_at', endDate.toISOString());

        if (error) throw error;
        return data.reduce((sum, claim) => sum + (claim.reward_amount || 0), 0);
    }

    private async getActiveUserCount(startDate: Date, endDate: Date): Promise<number> {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('is_active', true)
            .gte('last_login_at', startDate.toISOString())
            .lt('last_login_at', endDate.toISOString());

        if (error) throw error;
        return data.length;
    }

    private calculateChangePercentage(current: number, previous: number): number {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    }

    private async getDailyMissionRewards(startDate: Date, endDate: Date): Promise<Record<string, number>> {
        const { data, error } = await supabase
            .from('mission_reward_claims')
            .select('claimed_at, reward_amount')
            .eq('claim_status', 'COMPLETED')
            .gte('claimed_at', startDate.toISOString())
            .lt('claimed_at', endDate.toISOString());

        if (error) throw error;

        return this.aggregateByDate(data, 'claimed_at', 'reward_amount');
    }

    private async getDailyAdRewards(startDate: Date, endDate: Date): Promise<Record<string, number>> {
        const { data, error } = await supabase
            .from('ad_reward_claims')
            .select('claimed_at, reward_amount')
            .eq('claim_status', 'COMPLETED')
            .gte('claimed_at', startDate.toISOString())
            .lt('claimed_at', endDate.toISOString());

        if (error) throw error;

        return this.aggregateByDate(data, 'claimed_at', 'reward_amount');
    }

    private async getDailyMissionUsers(startDate: Date, endDate: Date): Promise<Record<string, number>> {
        const { data, error } = await supabase
            .from('mission_reward_claims')
            .select('claimed_at, user_id')
            .gte('claimed_at', startDate.toISOString())
            .lt('claimed_at', endDate.toISOString());

        if (error) throw error;

        return this.aggregateUniqueUsersByDate(data, 'claimed_at', 'user_id');
    }

    private async getDailyAdUsers(startDate: Date, endDate: Date): Promise<Record<string, number>> {
        const { data, error } = await supabase
            .from('ad_reward_claims')
            .select('claimed_at, user_id')
            .gte('claimed_at', startDate.toISOString())
            .lt('claimed_at', endDate.toISOString());

        if (error) throw error;

        return this.aggregateUniqueUsersByDate(data, 'claimed_at', 'user_id');
    }

    private async getDailyActiveUsers(startDate: Date, endDate: Date): Promise<Record<string, number>> {
        const { data, error } = await supabase
            .from('users')
            .select('last_login_at')
            .eq('is_active', true)
            .gte('last_login_at', startDate.toISOString())
            .lt('last_login_at', endDate.toISOString());

        if (error) throw error;

        return this.aggregateByDate(data, 'last_login_at', null);
    }

    private aggregateByDate(data: any[], dateField: string, valueField: string | null): Record<string, number> {
        const result: Record<string, number> = {};

        data.forEach(item => {
            const date = new Date(item[dateField]).toISOString().split('T')[0];
            if (!result[date]) {
                result[date] = valueField ? (item[valueField] || 0) : 1;
            } else {
                result[date] += valueField ? (item[valueField] || 0) : 1;
            }
        });

        return result;
    }

    private aggregateUniqueUsersByDate(data: any[], dateField: string, userField: string): Record<string, number> {
        const result: Record<string, number> = {};

        data.forEach(item => {
            const date = new Date(item[dateField]).toISOString().split('T')[0];
            if (!result[date]) {
                result[date] = new Set([item[userField]]).size;
            } else {
                const uniqueUsers = new Set([...new Set([item[userField]])]);
                result[date] = uniqueUsers.size;
            }
        });

        return result;
    }

    // 전체 기간 총 리워드 보상 LFIT 수
    async getTotalRewardAmountAllTime(): Promise<number> {
        const { data, error } = await supabase
            .from('mission_reward_claims')
            .select('reward_amount')
            .eq('claim_status', 'COMPLETED');
        if (error) throw error;
        return data.reduce((sum, claim) => sum + (claim.reward_amount || 0), 0);
    }

    // 주소별 지급 보상 LFIT 수
    async getRewardAmountByAddress(): Promise<{ wallet_address: string, total_reward: number }[]> {
        const { data, error } = await supabase
            .from('mission_reward_claims')
            .select('wallet_address, reward_amount')
            .eq('claim_status', 'COMPLETED');
        if (error) throw error;
        const result: Record<string, number> = {};
        data.forEach(claim => {
            if (!claim.wallet_address) return;
            result[claim.wallet_address] = (result[claim.wallet_address] || 0) + (claim.reward_amount || 0);
        });
        return Object.entries(result).map(([wallet_address, total_reward]) => ({ wallet_address, total_reward }));
    }

    // 실패 상태의 트랜잭션 레코드 수
    async getFailedTransactionCount(): Promise<number> {
        const { count, error } = await supabase
            .from('mission_reward_claims')
            .select('id', { count: 'exact' })
            .eq('claim_status', 'FAILED');
        if (error) throw error;
        return count || 0;
    }

    // 날짜별 트랜잭션 수 및 보상량 수
    async getDailyTransactionStats(startDate: Date, endDate: Date): Promise<{ date: string, count: number, total_reward: number }[]> {
        const { data, error } = await supabase
            .from('mission_reward_claims')
            .select('claimed_at, reward_amount')
            .gte('claimed_at', startDate.toISOString())
            .lt('claimed_at', endDate.toISOString());
        if (error) throw error;
        const stats: Record<string, { count: number, total_reward: number }> = {};
        data.forEach(claim => {
            const date = new Date(claim.claimed_at).toISOString().split('T')[0];
            if (!stats[date]) stats[date] = { count: 0, total_reward: 0 };
            stats[date].count += 1;
            stats[date].total_reward += claim.reward_amount || 0;
        });
        return Object.entries(stats).map(([date, { count, total_reward }]) => ({ date, count, total_reward }));
    }
} 