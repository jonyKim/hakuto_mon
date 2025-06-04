export interface MissionClaim {
    id: string;
    wallet_address: string;
    steps_achieved: number;
    reward_amount: number;
    claim_status: 'PENDING' | 'COMPLETED' | 'FAILED';
    transaction_hash?: string;
    claimed_at: string;
  }
  
  export interface MissionClaimStatistics {
    total_claims: number;
    completed_claims: number;
    pending_claims: number;
    failed_claims: number;
    total_rewarded_amount: number;
    total_steps_achieved: number;
  }

  export interface MissionClaimsResponse {
    success: boolean;
    data: MissionClaim[];
  }

  export interface MissionClaimStatisticsResponse {
    success: boolean;
    data: MissionClaimStatistics;
  }


export interface MissionUpdateClaimResponse {
    success: boolean;
    data: MissionClaim;
}