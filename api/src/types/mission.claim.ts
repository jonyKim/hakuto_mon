export enum MissionRewardClaimStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export interface MissionRewardClaim {
    id: string;
    user_id: string;
    wallet_address: string;
    mission_id: string;
    steps_achieved: number;
    reward_amount: number;
    claim_status: MissionRewardClaimStatus;
    transaction_hash?: string;
    claimed_at: string;
    created_at: string;
    updated_at: string;
}

export interface MissionRewardClaimStatistics {
    total_claims: number;
    completed_claims: number;
    pending_claims: number;
    failed_claims: number;
    total_rewarded_amount: number;
    total_steps_achieved: number;
}

export interface CreateMissionRewardClaimDto {
    user_id: string;
    wallet_address: string;
    mission_id: string;
    steps: number;
    reward_amount: number;
    claimed_at: string;
} 