import axiosInstance from '@/lib/axios';
import axios from 'axios';

export const nftStatsApi = {
  getStats: async () => {
    try {
        console.log('Fetching NFT stats...');
        const { data } = await axiosInstance.get('/api/admin/nft-stats/stats');
        console.log('NFT stats response:', data);
        return data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error fetching nft stats:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers
          });
        } else {
          console.error('Error fetching nft stats:', error);
        }
        throw error;
      }
  }
}; 