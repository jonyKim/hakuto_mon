import axiosInstance from '@/lib/axios';

export const dashboardApi = {
  // 총 리워드 보상 LFIT 수
  getTotalRewards: async () => {
    const { data } = await axiosInstance.get('/api/admin/dashboard/total-rewards');
    return data;
  },
  // 주소별 지급 보상 LFIT 수
  getRewardsByAddress: async () => {
    const { data } = await axiosInstance.get('/api/admin/dashboard/rewards-by-address');
    return data;
  },
  // 실패 상태의 트랜잭션 레코드 수
  getFailedTransactions: async () => {
    const { data } = await axiosInstance.get('/api/admin/dashboard/failed-transactions');
    return data;
  },
  // 날짜별 트랜잭션 수 및 보상량 수
  getDailyStats: async (startDate: string, endDate: string) => {
    const { data } = await axiosInstance.get('/api/admin/dashboard/daily-stats', {
      params: { startDate, endDate }
    });
    return data;
  },
  // 오늘의 미션 현황
  getTodayMissionStats: async () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const { data } = await axiosInstance.get('/api/admin/dashboard/mission-stats', {
      params: {
        start_date: startOfDay.toISOString(),
        end_date: endOfDay.toISOString(),
      }
    });
    return data;
  },
  getDashboardOverview: async () => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30); // Last 30 days
    const endDate = new Date();
    const { data } = await axiosInstance.get('/api/admin/dashboard', {
      params: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }
    });
    return data;
  },
};
