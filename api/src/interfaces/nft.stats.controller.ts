import { Request, Response } from 'express';
import { NFTStatsService } from '../application/nft.stats.service';

export class NFTStatsController {
  constructor(private readonly nftStatsService: NFTStatsService) {}

  async getNFTStats(_req: Request, res: Response) {
    try {
      console.log('NFTStatsController: Fetching NFT stats...');
      const stats = await this.nftStatsService.getNFTStats();
      console.log('NFTStatsController: Stats fetched successfully:', stats);
      res.json(stats);
    } catch (error) {
      console.error('NFTStatsController: Error fetching NFT stats:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      res.status(500).json({ 
        message: 'NFT 통계를 가져오는 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 