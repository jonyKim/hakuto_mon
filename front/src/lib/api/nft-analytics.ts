import axiosInstance from '@/lib/axios'
import axios from 'axios'

// API 응답 타입 정의
export interface HolderStatistics {
  contractName: string
  contractAddress: string
  totalNfts: number
  uniqueHolders: number
  avgNftsPerHolder: number
  earliestActivity: string | null
  latestActivity: string | null
}

export interface HolderDistribution {
  holderTier: string
  holderCount: number
  totalNfts: number
  avgNfts: number
}

export interface TopHolder {
  ownerAddress: string
  contractName: string
  nftCount: number
  firstAcquisition: string | null
  lastActivity: string | null
  tokenIds: string[]
  isStakingAdmin?: boolean
}

export interface HolderTrend {
  date: string
  contractName: string
  activeHolders: number
  totalActivities: number
}

export interface RecentActivity {
  date: string
  contractName: string
  ownerAddress: string
  nftCount: number
  firstActivity: string
  lastActivity: string
  tokenIds: string[]
  activityType?: string
}

export interface StakingAdminActivity {
  ownerAddress: string
  contractName: string
  nftCount: number
  firstActivity: string | null
  lastActivity: string | null
  tokenIds: string[]
}

export interface AnomalousPattern {
  whaleHolders: TopHolder[]
  recentSurge: RecentActivity[]
}

export interface DashboardSummary {
  totalNfts: number
  totalHolders: number
  avgNftsPerHolder: number
  contractStats: HolderStatistics[]
  topHolders: TopHolder[]
  recentActivities: RecentActivity[]
  holderDistribution: HolderDistribution[]
}

// API 클라이언트 함수들
export const nftAnalyticsApi = {
  // 대시보드 요약 데이터
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    try {
      console.log('Fetching NFT analytics dashboard summary...')
      const { data } = await axiosInstance.get('/api/nft-analytics/dashboard/summary')
      console.log('Dashboard summary response:', data)
      return data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching dashboard summary:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        })
      } else {
        console.error('Error fetching dashboard summary:', error)
      }
      throw error
    }
  },

  // 홀더 통계
  getHolderStatistics: async (): Promise<HolderStatistics[]> => {
    try {
      console.log('Fetching NFT holder statistics...')
      const { data } = await axiosInstance.get('/api/nft-analytics/holders/statistics')
      console.log('Holder statistics response:', data)
      return data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching holder statistics:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        })
      } else {
        console.error('Error fetching holder statistics:', error)
      }
      throw error
    }
  },

  // 홀더 분포
  getHolderDistribution: async (contractAddress?: string): Promise<{
    topHolders: TopHolder[]
    distribution: HolderDistribution[]
  }> => {
    try {
      console.log('Fetching NFT holder distribution...')
      const params = contractAddress ? { contractAddress } : {}
      const { data } = await axiosInstance.get('/api/nft-analytics/holders/distribution', { params })
      console.log('Holder distribution response:', data)
      return data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching holder distribution:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        })
      } else {
        console.error('Error fetching holder distribution:', error)
      }
      throw error
    }
  },

  // 상위 홀더
  getTopHolders: async (limit: number = 20, contractAddress?: string): Promise<TopHolder[]> => {
    try {
      console.log('Fetching top NFT holders...')
      const params: any = { limit }
      if (contractAddress) params.contractAddress = contractAddress
      const { data } = await axiosInstance.get('/api/nft-analytics/holders/top', { params })
      console.log('Top holders response:', data)
      return data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching top holders:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        })
      } else {
        console.error('Error fetching top holders:', error)
      }
      throw error
    }
  },

  // 홀더 트렌드
  getHolderTrends: async (days: number = 30, contractAddress?: string): Promise<HolderTrend[]> => {
    try {
      console.log('Fetching NFT holder trends...')
      const params: any = { days }
      if (contractAddress) params.contractAddress = contractAddress
      const { data } = await axiosInstance.get('/api/nft-analytics/holders/trends', { params })
      console.log('Holder trends response:', data)
      return data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching holder trends:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        })
      } else {
        console.error('Error fetching holder trends:', error)
      }
      throw error
    }
  },

  // 최근 활동
  getRecentActivity: async (limit: number = 50, days: number = 7): Promise<RecentActivity[]> => {
    try {
      console.log('Fetching recent NFT activities...')
      const { data } = await axiosInstance.get('/api/nft-analytics/activity/recent', {
        params: { limit, days }
      })
      console.log('Recent activity response:', data)
      return data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching recent activity:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        })
      } else {
        console.error('Error fetching recent activity:', error)
      }
      throw error
    }
  },

  // 스테이킹 어드민 활동
  getStakingAdminActivity: async (): Promise<StakingAdminActivity[]> => {
    try {
      console.log('Fetching staking admin activity...')
      const { data } = await axiosInstance.get('/api/nft-analytics/admin/staking')
      console.log('Staking admin activity response:', data)
      return data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching staking admin activity:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        })
      } else {
        console.error('Error fetching staking admin activity:', error)
      }
      throw error
    }
  },

  // 이상 패턴 감지
  getAnomalousPatterns: async (): Promise<AnomalousPattern> => {
    try {
      console.log('Fetching anomalous patterns...')
      const { data } = await axiosInstance.get('/api/nft-analytics/patterns/anomalous')
      console.log('Anomalous patterns response:', data)
      return data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching anomalous patterns:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        })
      } else {
        console.error('Error fetching anomalous patterns:', error)
      }
      throw error
    }
  },

  // 특정 홀더 상세 정보
  getHolderDetails: async (address: string): Promise<any[]> => {
    try {
      console.log(`Fetching holder details for ${address}...`)
      const { data } = await axiosInstance.get(`/api/nft-analytics/holders/${address}/details`)
      console.log('Holder details response:', data)
      return data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching holder details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        })
      } else {
        console.error('Error fetching holder details:', error)
      }
      throw error
    }
  }
}
