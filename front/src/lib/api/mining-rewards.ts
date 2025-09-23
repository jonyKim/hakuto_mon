import axiosInstance from '@/lib/axios';
import axios from 'axios';

// API 응답 타입 정의
export interface MiningRewardSummary {
  totalMiners: number;
  totalRewardsGenerated: number;
  totalRewardsDays: number;
  avgRewardsPerMiner: number;
  avgRewardsDaysPerMiner: number;
  activeMiners: number;
  completedMiners: number;
  maxRewardsDays: number;
}

export interface MinerDetails {
  ownWalletAddress: string;
  contractAddress: string;
  getRewards: number;
  rewardsDays: number;
  remainingDays: number;
  isCompleted: boolean;
  dailyRewardRate: number;
  projectedTotalRewards: number;
  firstRewardDate: string | null;
  lastRewardDate: string | null;
}

export interface DailyMiningStats {
  date: string;
  totalDailyRewards: number;
  activeMinerCount: number;
  newMinersCount: number;
  completedMinersCount: number;
  avgDailyRewardPerMiner: number;
}

export interface ContractMiningStats {
  contractAddress: string;
  contractName: string;
  totalMiners: number;
  totalRewards: number;
  avgRewardsPerMiner: number;
  avgRewardsDays: number;
  activeMiners: number;
  completedMiners: number;
}

export interface MiningTrends {
  date: string;
  cumulativeRewards: number;
  dailyRewards: number;
  activeMinerCount: number;
  completionRate: number;
}

export interface RewardCompletionAnalysis {
  completionRateByContract: {
    contractName: string;
    completionRate: number;
    totalMiners: number;
  }[];
  rewardsDaysDistribution: {
    daysRange: string;
    minerCount: number;
    percentage: number;
  }[];
}

// API 클라이언트 함수들
export const miningRewardsAPI = {
  // 마이닝 보상 요약 통계
  getMiningRewardSummary: async (): Promise<MiningRewardSummary> => {
    try {
      console.log('Fetching mining reward summary...');
      const { data } = await axiosInstance.get('/api/mining-rewards/summary');
      console.log('Mining reward summary response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching mining reward summary:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching mining reward summary:', error);
      }
      throw error;
    }
  },

  // 상위 마이너 조회
  getTopMiners: async (limit: number = 50): Promise<MinerDetails[]> => {
    try {
      console.log('Fetching top miners...');
      const { data } = await axiosInstance.get('/api/mining-rewards/top-miners', {
        params: { limit }
      });
      console.log('Top miners response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching top miners:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching top miners:', error);
      }
      throw error;
    }
  },

  // 특정 마이너 상세 정보
  getMinerDetails: async (address: string): Promise<MinerDetails> => {
    try {
      console.log(`Fetching miner details for ${address}...`);
      const { data } = await axiosInstance.get(`/api/mining-rewards/miners/${address}`);
      console.log('Miner details response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching miner details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching miner details:', error);
      }
      throw error;
    }
  },

  // 일별 마이닝 통계
  getDailyMiningStats: async (days: number = 30): Promise<DailyMiningStats[]> => {
    try {
      console.log('Fetching daily mining stats...');
      const { data } = await axiosInstance.get('/api/mining-rewards/daily-stats', {
        params: { days }
      });
      console.log('Daily mining stats response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching daily mining stats:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching daily mining stats:', error);
      }
      throw error;
    }
  },

  // 컨트랙트별 마이닝 통계
  getContractMiningStats: async (): Promise<ContractMiningStats[]> => {
    try {
      console.log('Fetching contract mining stats...');
      const { data } = await axiosInstance.get('/api/mining-rewards/contracts/stats');
      console.log('Contract mining stats response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching contract mining stats:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching contract mining stats:', error);
      }
      throw error;
    }
  },

  // 마이닝 트렌드
  getMiningTrends: async (days: number = 30): Promise<MiningTrends[]> => {
    try {
      console.log('Fetching mining trends...');
      const { data } = await axiosInstance.get('/api/mining-rewards/trends', {
        params: { days }
      });
      console.log('Mining trends response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching mining trends:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching mining trends:', error);
      }
      throw error;
    }
  },

  // 보상 완료율 분석
  getRewardCompletionAnalysis: async (): Promise<RewardCompletionAnalysis> => {
    try {
      console.log('Fetching reward completion analysis...');
      const { data } = await axiosInstance.get('/api/mining-rewards/completion-analysis');
      console.log('Reward completion analysis response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching reward completion analysis:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching reward completion analysis:', error);
      }
      throw error;
    }
  }
};
