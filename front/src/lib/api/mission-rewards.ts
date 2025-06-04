import { CreateMissionRewardDto, UpdateMissionRewardDto, MissionRewardResponse, MissionRewardsResponse } from '@/types/rewards';
import axiosInstance from '@/lib/axios';

const MISSION_REWARDS_API = '/api/admin/mission-rewards';

export const missionRewardsApi = {
  // 모든 미션 보상 조회
  getAllMissionRewards: async (): Promise<MissionRewardsResponse> => {
    try {
      const { data } = await axiosInstance.get<MissionRewardsResponse>(MISSION_REWARDS_API);
      return data;
    } catch (error) {
      console.error('Error fetching all mission rewards:', error);
      throw error;
    }
  },

  // 특정 미션 보상 조회
  getMissionRewardById: async (id: string): Promise<MissionRewardResponse> => {
    try {
      const { data } = await axiosInstance.get<MissionRewardResponse>(`${MISSION_REWARDS_API}/${id}`);
      return data;
    } catch (error) {
      console.error('Error fetching mission reward by ID:', error);
      throw error;
    }
  },

  // 새로운 미션 보상 생성
  createMissionReward: async (data: CreateMissionRewardDto): Promise<MissionRewardResponse> => {
    try {
      const { data: response } = await axiosInstance.post<MissionRewardResponse>(MISSION_REWARDS_API, data);
      return response;
    } catch (error) {
      console.error('Error creating mission reward:', error);
      throw error;
    }
  },

  // 미션 보상 수정
  updateMissionReward: async (id: string, data: UpdateMissionRewardDto): Promise<MissionRewardResponse> => {
    try {
      const { data: response } = await axiosInstance.put<MissionRewardResponse>(`${MISSION_REWARDS_API}/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating mission reward:', error);
      throw error;
    }
  },
}; 