import { NFTStatsRepository } from '../infrastructure/nft.stats.repository';

export class NFTStatsService {
  constructor(private readonly nftStatsRepository: NFTStatsRepository) {}

  async getNFTStats() {
    console.log('getNFTStats');

    const nftsByType = await this.nftStatsRepository.getNFTsByType();

    console.log('nftsByType', nftsByType);

    return {
      total: nftsByType.total,
      by_type: nftsByType.by_type
    };
  }
} 