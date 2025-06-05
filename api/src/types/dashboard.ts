export interface DashboardStats {
    total_nfts: number;
    total_nfts_change: number;
    total_staked: number;
    total_staked_change: number;
    total_rewards: number;
    total_rewards_change: number;
    staking_stats: StakingStats[];
    today_withdrawn: number;
}

export interface StakingTrend {
    date: string;
    count: number;
    total_staked: number;
}

export interface RewardTrend {
    date: string;
    count: number;
    total_reward: number;
}

export interface StakingStats {
    nft_type: string;
    count: number;
    total_staked: number;
}

export interface DashboardOverview {
    stats: DashboardStats;
    staking_trends: StakingTrend[];
    reward_trends: RewardTrend[];
}