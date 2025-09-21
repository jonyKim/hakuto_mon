import axiosInstance from '@/lib/axios';
import axios from 'axios';

// 인터페이스 정의
export interface TokenHolderSummary {
  tokenVersion: string;
  tokenName: string;
  tokenSymbol: string;
  totalHolders: number;
  activeHolders: number;
  totalBalance: number;
  maxBalance: number;
  avgBalance: number;
  whaleCount: number;
  largeCount: number;
  mediumCount: number;
  smallCount: number;
}

export interface TopTokenHolder {
  holderAddress: string;
  tokenVersion: string;
  balanceFormatted: number;
  percentageOfSupply: number;
  holderRank: number;
  holderCategory: string;
  transactionCount: number;
  firstAcquisitionDate: string;
  lastActivityDate: string;
}

export interface TokenTransaction {
  transactionHash: string;
  blockNumber: number;
  datetimeUtc: string;
  tokenVersion: string;
  fromAddress: string;
  toAddress: string;
  quantityFormatted: number;
  method: string;
  isTransfer: boolean;
  isSwap: boolean;
  isMint: boolean;
}

export interface MigrationStatus {
  holderAddress: string;
  v1Balance: number;
  v2Balance: number;
  totalBalance: number;
  v1Percentage: number;
  v2Percentage: number;
  migrationStatus: 'v1_only' | 'v2_only' | 'partial' | 'complete';
  holderCategory: string;
}

export interface TokenDistribution {
  tokenVersion: string;
  holderTier: string;
  holderCount: number;
  totalBalance: number;
  percentage: number;
}

export interface DailyTokenStats {
  date: string;
  tokenVersion: string;
  totalHolders: number;
  totalTransactions: number;
  totalVolume: number;
  newHolders: number;
  activeHolders: number;
}

export interface TokenStatsSummary {
  v1Holders: number;
  v2Holders: number;
  v1TotalBalance: number;
  v2TotalBalance: number;
  uniqueHolders: number;
  v1Transactions: number;
  v2Transactions: number;
  totalHolders: number;
  totalTransactions: number;
}

// API 클라이언트 함수들
export const tokenAnalyticsAPI = {

  // 토큰 통계 요약
  async getTokenStatsSummary(): Promise<TokenStatsSummary> {
    try {
      console.log('Fetching token stats summary...');
      const response = await axiosInstance.get('/api/token-analytics/summary');
      console.log('Token stats summary response:', response.data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching token stats summary:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      } else {
        console.error('Error fetching token stats summary:', error);
      }
      throw error;
    }
  },

  // 토큰 홀더 요약 통계
  getTokenHolderSummary: async (): Promise<TokenHolderSummary[]> => {
    try {
      console.log('Fetching token holder summary...');
      const response = await axiosInstance.get('/api/token-analytics/holders/summary');
      console.log('Token holder summary response:', response.data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching token holder summary:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching token holder summary:', error);
      }
      throw error;
    }
  },

  // 상위 토큰 홀더 조회
  getTopTokenHolders: async (tokenVersion?: string, limit: number = 50): Promise<TopTokenHolder[]> => {
    try {
      console.log('Fetching top token holders...');
      const params: any = { limit };
      if (tokenVersion) params.tokenVersion = tokenVersion;
      const response = await axiosInstance.get('/api/token-analytics/holders/top', { params });
      console.log('Top token holders response:', response.data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching top token holders:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching top token holders:', error);
      }
      throw error;
    }
  },

  // 최근 토큰 트랜잭션 조회
  getRecentTokenTransactions: async (limit: number = 100): Promise<TokenTransaction[]> => {
    try {
      console.log('Fetching recent token transactions...');
      const response = await axiosInstance.get('/api/token-analytics/transactions/recent', {
        params: { limit }
      });
      console.log('Recent token transactions response:', response.data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching recent token transactions:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching recent token transactions:', error);
      }
      throw error;
    }
  },

  // 마이그레이션 상태 분석
  getMigrationStatus: async (): Promise<MigrationStatus[]> => {
    try {
      console.log('Fetching migration status...');
      const response = await axiosInstance.get('/api/token-analytics/migration/status');
      console.log('Migration status response:', response.data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching migration status:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching migration status:', error);
      }
      throw error;
    }
  },

  // 토큰 분포 분석
  getTokenDistribution: async (): Promise<TokenDistribution[]> => {
    try {
      console.log('Fetching token distribution...');
      const response = await axiosInstance.get('/api/token-analytics/distribution');
      console.log('Token distribution response:', response.data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching token distribution:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching token distribution:', error);
      }
      throw error;
    }
  },

  // 일별 토큰 통계
  getDailyTokenStats: async (): Promise<DailyTokenStats[]> => {
    try {
      console.log('Fetching daily token stats...');
      const response = await axiosInstance.get('/api/token-analytics/stats/daily');
      console.log('Daily token stats response:', response.data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching daily token stats:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching daily token stats:', error);
      }
      throw error;
    }
  },

  // 특정 홀더 상세 정보
  getHolderDetails: async (holderAddress: string): Promise<any[]> => {
    try {
      console.log(`Fetching holder details for ${holderAddress}...`);
      const response = await axiosInstance.get(`/api/token-analytics/holders/${holderAddress}`);
      console.log('Holder details response:', response.data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching holder details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching holder details:', error);
      }
      throw error;
    }
  }
};
