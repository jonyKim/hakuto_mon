import axiosInstance from '@/lib/axios';

export interface EmailVerificationAttempt {
  id: string;
  userId: string;
  email: string;
  verificationCode: string;
  isVerified: boolean;
  attemptsCount: number;
  expiresAt: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    walletAddress: string;
    email: string;
  };
}

export interface EmailVerificationStats {
  totalAttempts: number;
  successfulVerifications: number;
  failedAttempts: number;
  pendingVerifications: number;
  todayAttempts: number;
  successRate: number;
}

export interface SendVerificationRequest {
  user_id: string;
  email: string;
}

export interface VerifyCodeRequest {
  verification_code: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface EmailVerificationStatsResponse {
  success: boolean;
  data: EmailVerificationStats;
}

export const emailVerificationApi = {
  // 인증 코드 발송
  async sendVerificationCode(request: SendVerificationRequest): Promise<EmailVerificationResponse> {
    const { data } = await axiosInstance.post('/api/email-verification/send', request);
    return data;
  },

  // 인증 코드 검증
  async verifyCode(request: VerifyCodeRequest): Promise<EmailVerificationResponse> {
    const { data } = await axiosInstance.post('/api/email-verification/verify', request);
    return data;
  },

  // 사용자 인증 상태 조회
  async getVerificationStatus(userId: string): Promise<EmailVerificationResponse> {
    const { data } = await axiosInstance.get(`/api/email-verification/status/${userId}`);
    return data;
  },

  // 인증 시도 통계 (어드민용)
  async getStats(): Promise<EmailVerificationStatsResponse> {
    const { data } = await axiosInstance.get('/api/admin/email-verification/stats');
    return data;
  },

  // 최근 인증 시도 목록 (어드민용)
  async getRecentAttempts(limit: number = 50): Promise<{ success: boolean; data: EmailVerificationAttempt[] }> {
    const { data } = await axiosInstance.get('/api/admin/email-verification/attempts', {
      params: { limit }
    });
    return data;
  },

  // 특정 사용자의 인증 시도 이력
  async getUserAttempts(userId: string): Promise<{ success: boolean; data: EmailVerificationAttempt[] }> {
    const { data } = await axiosInstance.get(`/api/admin/email-verification/attempts/${userId}`);
    return data;
  },

  // 만료된 인증 시도 정리 (어드민용)
  async cleanupExpiredAttempts(): Promise<EmailVerificationResponse> {
    const { data } = await axiosInstance.delete('/api/admin/email-verification/cleanup');
    return data;
  }
};
