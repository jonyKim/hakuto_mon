export interface AdReward {
  id: string;
  min_reward: number;
  max_reward: number;
  daily_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
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

export interface AdRewardResponse {
  success: boolean;
  data: AdReward;
}

export interface AdRewardsResponse {
  success: boolean;
  data: AdReward[];
} 