import axiosInstance from '@/lib/axios';

export const stakeStatsApi = {
  getSummary: async () => {
    const { data } = await axiosInstance.get('/api/admin/staking-stats/summary');
    return data;
  }
};
