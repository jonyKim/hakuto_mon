import axiosInstance from '@/lib/axios';

export interface WalletUser {
  id: string;
  wallet_address: string;
  email: string;
  email_verified: boolean;
  verification_token?: string;
  fcm_token?: string;
  created_at: string;
  updated_at: string;
}

export interface WalletUserStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  todayRegistrations: number;
}

export interface WalletUserSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  verified?: boolean;
}

export interface WalletUserResponse {
  success: boolean;
  data: {
    users: WalletUser[];
  } | WalletUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
    pages?: number;
  };
}

export interface WalletUserStatsResponse {
  success: boolean;
  data: WalletUserStats;
}

export const walletUsersApi = {
  // 지갑 사용자 목록 조회
  async getUsers(params: WalletUserSearchParams = {}): Promise<WalletUserResponse> {
    const { data } = await axiosInstance.get('/api/admin/wallet-users', { params });
    return data;
  },

  // 지갑 사용자 상세 조회
  async getUser(id: string): Promise<{ success: boolean; data: WalletUser }> {
    const { data } = await axiosInstance.get(`/api/admin/wallet-users/${id}`);
    return data;
  },

  // 지갑 사용자 통계
  async getStats(): Promise<WalletUserStatsResponse> {
    const { data } = await axiosInstance.get('/api/admin/wallet-users/stats');
    return data;
  },

  // 지갑 사용자 검색
  async searchUsers(query: string, params: WalletUserSearchParams = {}): Promise<WalletUserResponse> {
    const { data } = await axiosInstance.get('/api/admin/wallet-users/search', {
      params: { q: query, ...params }
    });
    return data;
  },

  // 지갑 사용자 삭제
  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await axiosInstance.delete(`/api/admin/wallet-users/${id}`);
    return data;
  },

  // 이메일 인증 상태 업데이트
  async updateVerificationStatus(id: string, verified: boolean): Promise<{ success: boolean; message: string }> {
    const { data } = await axiosInstance.patch(`/api/admin/wallet-users/${id}/verification`, {
      email_verified: verified
    });
    return data;
  }
};
