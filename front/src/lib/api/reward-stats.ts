import axiosInstance from '@/lib/axios';

export const rewardStatsApi = {
  getSummary: async () => {
    const { data } = await axiosInstance.get('/api/admin/reward-stats/summary');
    return data;
  }
};
