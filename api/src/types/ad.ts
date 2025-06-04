export interface AdReward {
    id: string;
    min_reward: number;
    max_reward: number;
    daily_limit: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    updated_by?: string;
}

export interface AdRewardClaim {
    id: string;
    user_id: string;
    wallet_address: string;
    reward_amount: number;
    claim_status: 'PENDING' | 'COMPLETED' | 'FAILED';
    transaction_hash?: string;
    claimed_at: Date;
    created_at: Date;
    updated_at: Date;
}

export interface CreateAdRewardDto {
    min_reward: number;
    max_reward: number;
    daily_limit: number;
}

export interface UpdateAdRewardDto {
    min_reward?: number;
    max_reward?: number;
    daily_limit?: number;
    is_active?: boolean;
}

export interface AdRewardStats {
    total_views: number;
    unique_users: number;
    total_rewards: number;
    avg_reward: number;
    completed_claims: number;
    failed_claims: number;
} 