import { CreateAdRewardDto, UpdateAdRewardDto, AdRewardResponse, AdRewardsResponse } from '@/types/ad';
import axiosInstance from '@/lib/axios';

const AD_REWARDS_API = '/api/admin/ad-rewards';

export const adRewardsApi = {
  // 모든 광고 보상 조회
  getAllAdRewards: async (): Promise<AdRewardsResponse> => {
    try {
      const { data } = await axiosInstance.get<AdRewardsResponse>(AD_REWARDS_API);
      return data;
    } catch (error) {
      console.error('Error fetching all ad rewards:', error);
      throw error;
    }
  },

  // 특정 광고 보상 조회
  getAdRewardById: async (id: string): Promise<AdRewardResponse> => {
    try {
      const { data } = await axiosInstance.get<AdRewardResponse>(`${AD_REWARDS_API}/${id}`);
      return data;
    } catch (error) {
      console.error('Error fetching ad reward by ID:', error);
      throw error;
    }
  },

  // 새로운 광고 보상 생성
  createAdReward: async (data: CreateAdRewardDto): Promise<AdRewardResponse> => {
    try {
      const { data: response } = await axiosInstance.post<AdRewardResponse>(AD_REWARDS_API, data);
      return response;
    } catch (error) {
      console.error('Error creating ad reward:', error);
      throw error;
    }
  },

  // 광고 보상 수정
  updateAdReward: async (id: string, data: UpdateAdRewardDto): Promise<AdRewardResponse> => {
    try {
      const { data: response } = await axiosInstance.put<AdRewardResponse>(`${AD_REWARDS_API}/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating ad reward:', error);
      throw error;
    }
  },
}; 