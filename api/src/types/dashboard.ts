import { AdRewardStats, AdRewardClaim } from './ad';
import { MissionRewardStats, MissionRewardClaim } from './mission';

export interface DashboardStats {
    total_users: number;
    total_users_change: number;
    total_rewards: number;
    total_rewards_change: number;
    active_users: number;
    active_users_change: number;
    mission_stats: MissionRewardStats;
    ad_stats: AdRewardStats;
}

export interface RewardTrend {
    date: string;
    mission_rewards: number;
    ad_rewards: number;
    total_rewards: number;
}

export interface UserActivityTrend {
    date: string;
    mission_participants: number;
    ad_viewers: number;
    active_users: number;
}

export interface DashboardOverview {
    stats: DashboardStats;
    reward_trends: RewardTrend[];
    user_activity_trends: UserActivityTrend[];
    recent_mission_claims: MissionRewardClaim[];
    recent_ad_claims: AdRewardClaim[];
} 