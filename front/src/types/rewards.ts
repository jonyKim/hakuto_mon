export interface MissionReward {
  id: string;
  steps: number;
  reward: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
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

export interface MissionRewardResponse {
  success: boolean;
  data: MissionReward;
}

export interface MissionRewardsResponse {
  success: boolean;
  data: MissionReward[];
}

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