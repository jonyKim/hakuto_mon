export enum AdRewardClaimStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export interface AdRewardClaim {
    id: string;
    user_id: string;
    wallet_address: string;
    reward_amount: number;
    claim_status: AdRewardClaimStatus;
    transaction_hash?: string;
    claimed_at: Date;
    created_at: Date;
    updated_at: Date;
    // Joined fields
    username?: string;
    email?: string;
}

export interface AdRewardClaimStatistics {
    total_claims: number;
    completed_claims: number;
    pending_claims: number;
    failed_claims: number;
    total_rewarded_amount: number;
} 