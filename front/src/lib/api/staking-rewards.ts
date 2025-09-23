import axiosInstance from '@/lib/axios';
import axios from 'axios';

// API 응답 타입 정의
export interface StakingRewardSummary {
  totalRewardTransactions: number;
  totalRewardAmount: number;
  totalRewardedStakers: number;
  avgRewardPerStaker: number;
  totalStakingDays: number;
  rewardDistributionDates: string[];
}

export interface StakerRewardDetails {
  stakerAddress: string;
  totalRewardAmount: number;
  rewardTransactionCount: number;
  firstRewardDate: string;
  lastRewardDate: string;
  avgRewardAmount: number;
  stakedNFTs: number;
  stakedCollections: string[];
  rewardTransactions: RewardTransaction[];
}

export interface RewardTransaction {
  transactionHash: string;
  blockNumber: number;
  datetimeUtc: string;
  fromAddress: string;
  toAddress: string;
  rewardAmount: number;
  tokenVersion: string;
}

export interface RewardDistribution {
  date: string;
  totalRewardAmount: number;
  rewardedStakers: number;
  avgRewardPerStaker: number;
  transactionCount: number;
}


// API 클라이언트 함수들
export const stakingRewardsAPI = {
  // 스테이킹 보상 요약 통계
  getStakingRewardSummary: async (): Promise<StakingRewardSummary> => {
    try {
      console.log('Fetching staking reward summary...');
      const { data } = await axiosInstance.get('/api/staking-rewards/summary');
      console.log('Staking reward summary response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching staking reward summary:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching staking reward summary:', error);
      }
      throw error;
    }
  },

  // 상위 보상 수령자 조회
  getTopRewardRecipients: async (limit: number = 50): Promise<StakerRewardDetails[]> => {
    try {
      console.log('Fetching top reward recipients...');
      const { data } = await axiosInstance.get('/api/staking-rewards/top-recipients', {
        params: { limit }
      });
      console.log('Top reward recipients response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching top reward recipients:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching top reward recipients:', error);
      }
      throw error;
    }
  },

  // 보상 분배 내역 조회
  getRewardDistribution: async (days: number = 30): Promise<RewardDistribution[]> => {
    try {
      console.log('Fetching reward distribution...');
      const { data } = await axiosInstance.get('/api/staking-rewards/distribution', {
        params: { days }
      });
      console.log('Reward distribution response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching reward distribution:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching reward distribution:', error);
      }
      throw error;
    }
  },


  // 최근 보상 트랜잭션 조회
  getRecentRewardTransactions: async (limit: number = 100): Promise<RewardTransaction[]> => {
    try {
      console.log('Fetching recent reward transactions...');
      const { data } = await axiosInstance.get('/api/staking-rewards/transactions', {
        params: { limit }
      });
      console.log('Recent reward transactions response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching recent reward transactions:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching recent reward transactions:', error);
      }
      throw error;
    }
  },

  // 스테이커별 보상 상세 정보 조회
  getStakerRewardDetails: async (address: string): Promise<StakerRewardDetails> => {
    try {
      console.log(`Fetching staker reward details for ${address}...`);
      const { data } = await axiosInstance.get(`/api/staking-rewards/stakers/${address}`);
      console.log('Staker reward details response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching staker reward details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching staker reward details:', error);
      }
      throw error;
    }
  }
};
