import axiosInstance from '@/lib/axios';
import axios from 'axios';

// API 응답 타입 정의
export interface StakingSummary {
  totalCollections: number;
  totalNFTs: number;
  totalStakedNFTs: number;
  totalUnstakedNFTs: number;
  totalStakers: number;
  activeStakers: number;
  stakingRate: number;
  totalStakingFees: number;
  avgStakingFee: number;
}

export interface CollectionStakingStats {
  contractAddress: string;
  collectionName: string;
  collectionSymbol: string;
  stakingAdminAddress: string;
  totalNFTs: number;
  totalTransactions: number;
  totalStaked: number;
  totalUnstaked: number;
  currentlyStaked: number;
  stakingRate: number;
  uniqueStakers: number;
  activeStakers: number;
  totalStakingFees: number;
  avgStakingFee: number;
  firstStakingDate: string | null;
  lastActivityDate: string | null;
}

export interface StakingTransaction {
  transactionHash: string;
  blockNumber: number;
  datetimeUtc: string;
  collectionName: string;
  contractAddress: string;
  fromAddress: string;
  toAddress: string;
  stakingAdminAddress: string;
  transactionType: 'stake' | 'unstake' | 'transfer' | 'mint';
  txnFee: number;
  method: string;
  tokenId?: string;
}

export interface TopStaker {
  stakerAddress: string;
  totalStakingTransactions: number;
  totalUnstakingTransactions: number;
  netStakedNFTs: number;
  totalStakingFees: number;
  avgStakingFee: number;
  firstStakingDate: string;
  lastActivityDate: string;
  stakedCollections: string[];
}

export interface StakingTrend {
  date: string;
  totalStakingTransactions: number;
  totalUnstakingTransactions: number;
  netStakingChange: number;
  uniqueStakers: number;
  totalFees: number;
}

export interface CollectionActivity {
  contractAddress: string;
  collectionName: string;
  date: string;
  stakingCount: number;
  unstakingCount: number;
  netChange: number;
  uniqueStakers: number;
  totalFees: number;
}

export interface StakerDetails {
  stakerAddress: string;
  collectionName: string;
  contractAddress: string;
  stakingCount: number;
  unstakingCount: number;
  netStaked: number;
  totalFees: number;
  firstStakingDate: string;
  lastActivityDate: string;
}

// API 클라이언트 함수들
export const stakingAnalyticsAPI = {
  // 스테이킹 요약 통계
  getStakingSummary: async (): Promise<StakingSummary> => {
    try {
      console.log('Fetching staking analytics summary...');
      const { data } = await axiosInstance.get('/api/staking-analytics/summary');
      console.log('Staking summary response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching staking summary:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      } else {
        console.error('Error fetching staking summary:', error);
      }
      throw error;
    }
  },

  // 컬렉션별 스테이킹 통계
  getCollectionStakingStats: async (): Promise<CollectionStakingStats[]> => {
    try {
      console.log('Fetching collection staking stats...');
      const { data } = await axiosInstance.get('/api/staking-analytics/collections/stats');
      console.log('Collection staking stats response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching collection staking stats:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching collection staking stats:', error);
      }
      throw error;
    }
  },

  // 스테이킹 트랜잭션 조회
  getStakingTransactions: async (limit: number = 100, collectionName?: string): Promise<StakingTransaction[]> => {
    try {
      console.log('Fetching staking transactions...');
      const params: any = { limit };
      if (collectionName && collectionName !== 'All') {
        params.collection = collectionName;
      }
      
      const { data } = await axiosInstance.get('/api/staking-analytics/transactions', {
        params
      });
      console.log('Staking transactions response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching staking transactions:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching staking transactions:', error);
      }
      throw error;
    }
  },

  // 상위 스테이커 조회
  getTopStakers: async (limit: number = 50): Promise<TopStaker[]> => {
    try {
      console.log('Fetching top stakers...');
      const { data } = await axiosInstance.get('/api/staking-analytics/top-stakers', {
        params: { limit }
      });
      console.log('Top stakers response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching top stakers:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching top stakers:', error);
      }
      throw error;
    }
  },

  // 스테이킹 트렌드 조회
  getStakingTrends: async (days: number = 30): Promise<StakingTrend[]> => {
    try {
      console.log('Fetching staking trends...');
      const { data } = await axiosInstance.get('/api/staking-analytics/trends', {
        params: { days }
      });
      console.log('Staking trends response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching staking trends:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching staking trends:', error);
      }
      throw error;
    }
  },

  // 컬렉션별 활동 내역 조회
  getCollectionActivity: async (days: number = 7): Promise<CollectionActivity[]> => {
    try {
      console.log('Fetching collection activity...');
      const { data } = await axiosInstance.get('/api/staking-analytics/collections/activity', {
        params: { days }
      });
      console.log('Collection activity response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching collection activity:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching collection activity:', error);
      }
      throw error;
    }
  },

  // 스테이커 상세 정보 조회
  getStakerDetails: async (address: string): Promise<StakerDetails[]> => {
    try {
      console.log(`Fetching staker details for ${address}...`);
      const { data } = await axiosInstance.get(`/api/staking-analytics/stakers/${address}`);
      console.log('Staker details response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching staker details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching staker details:', error);
      }
      throw error;
    }
  }
};
