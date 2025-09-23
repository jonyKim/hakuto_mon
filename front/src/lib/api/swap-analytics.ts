import axiosInstance from '@/lib/axios';
import axios from 'axios';

// API 응답 타입 정의
export interface SwapSummary {
  totalSwapTransactions: number;
  totalSwapVolume: number;
  v1ToV2SwapVolume: number;
  v2ToV1SwapVolume: number;
  uniqueSwappers: number;
  avgSwapAmount: number;
  largestSwap: number;
  smallestSwap: number;
}

export interface SwapTransaction {
  transactionHash: string;
  blockNumber: number;
  datetimeUtc: string;
  fromAddress: string;
  toAddress: string;
  fromTokenVersion: string;
  toTokenVersion: string;
  swapAmount: number;
  swapDirection: 'v1_to_v2' | 'v2_to_v1' | 'same_version';
  method: string;
}

export interface SwapTrend {
  date: string;
  swapCount: number;
  swapVolume: number;
  v1ToV2Volume: number;
  v2ToV1Volume: number;
  uniqueSwappers: number;
}

export interface TopSwapper {
  swapperAddress: string;
  totalSwapCount: number;
  totalSwapVolume: number;
  v1ToV2Volume: number;
  v2ToV1Volume: number;
  firstSwapDate: string;
  lastSwapDate: string;
  avgSwapAmount: number;
}

export interface SwapDistribution {
  swapAmountRange: string;
  swapCount: number;
  totalVolume: number;
  percentage: number;
}

export interface SwapperDetails {
  swapperAddress: string;
  totalSwaps: number;
  totalVolume: number;
  v1ToV2Volume: number;
  v2ToV1Volume: number;
  avgSwapAmount: number;
  largestSwap: number;
  smallestSwap: number;
  firstSwapDate: string;
  lastSwapDate: string;
}

// API 클라이언트 함수들
export const swapAnalyticsAPI = {
  // SWAP 요약 통계
  getSwapSummary: async (): Promise<SwapSummary> => {
    try {
      console.log('Fetching SWAP analytics summary...');
      const { data } = await axiosInstance.get('/api/swap-analytics/summary');
      console.log('SWAP summary response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching SWAP summary:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      } else {
        console.error('Error fetching SWAP summary:', error);
      }
      throw error;
    }
  },

  // SWAP 트랜잭션 조회
  getSwapTransactions: async (limit: number = 100): Promise<SwapTransaction[]> => {
    try {
      console.log('Fetching SWAP transactions...');
      const { data } = await axiosInstance.get('/api/swap-analytics/transactions', {
        params: { limit }
      });
      console.log('SWAP transactions response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching SWAP transactions:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching SWAP transactions:', error);
      }
      throw error;
    }
  },

  // SWAP 트렌드 조회
  getSwapTrends: async (days: number = 30): Promise<SwapTrend[]> => {
    try {
      console.log('Fetching SWAP trends...');
      const { data } = await axiosInstance.get('/api/swap-analytics/trends', {
        params: { days }
      });
      console.log('SWAP trends response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching SWAP trends:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching SWAP trends:', error);
      }
      throw error;
    }
  },

  // 상위 SWAP 사용자 조회
  getTopSwappers: async (limit: number = 50): Promise<TopSwapper[]> => {
    try {
      console.log('Fetching top swappers...');
      const { data } = await axiosInstance.get('/api/swap-analytics/top-swappers', {
        params: { limit }
      });
      console.log('Top swappers response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching top swappers:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching top swappers:', error);
      }
      throw error;
    }
  },

  // SWAP 분포 조회
  getSwapDistribution: async (): Promise<SwapDistribution[]> => {
    try {
      console.log('Fetching SWAP distribution...');
      const { data } = await axiosInstance.get('/api/swap-analytics/distribution');
      console.log('SWAP distribution response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching SWAP distribution:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching SWAP distribution:', error);
      }
      throw error;
    }
  },

  // SWAP 사용자 상세 정보 조회
  getSwapperDetails: async (address: string): Promise<SwapperDetails> => {
    try {
      console.log(`Fetching swapper details for ${address}...`);
      const { data } = await axiosInstance.get(`/api/swap-analytics/swappers/${address}`);
      console.log('Swapper details response:', data);
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching swapper details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching swapper details:', error);
      }
      throw error;
    }
  }
};
