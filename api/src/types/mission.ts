export interface MissionReward {
    id: string;
    steps: number;
    reward: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    updated_by?: string;
}

export interface MissionRewardClaim {
    id: string;
    user_id: string;
    wallet_address: string;
    mission_id: string;
    steps_achieved: number;
    reward_amount: number;
    claim_status: 'PENDING' | 'COMPLETED' | 'FAILED';
    transaction_hash?: string;
    claimed_at: Date;
    created_at: Date;
    updated_at: Date;
}

export interface CreateMissionRewardDto {
    steps: number;
    reward: number;
}

export interface UpdateMissionRewardDto {
    steps?: number;
    reward?: number;
    is_active?: boolean;
}

export interface MissionRewardStats {
    total_claims: number;
    total_rewards: number;
    completed_claims: number;
    failed_claims: number;
} 