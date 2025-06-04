import { Repository } from 'typeorm';
import { AppDataSource } from '../database';
import { NFT } from '../../domain/entities/nft.entity';

export class NFTRepository {
    private repository: Repository<NFT>;

    constructor() {
        this.repository = AppDataSource.getRepository(NFT);
    }

    async findById(id: string): Promise<NFT | null> {
        return this.repository.findOneBy({ id });
    }

    async findByContractAndTokenId(contractAddress: string, tokenId: string): Promise<NFT | null> {
        return this.repository.findOneBy({ contractAddress, tokenId });
    }

    async findByOwnerAddress(ownerAddress: string): Promise<NFT[]> {
        return this.repository.findBy({ ownerAddress });
    }

    async findStakedNFTs(): Promise<NFT[]> {
        return this.repository.findBy({ isStaked: true });
    }

    async create(nft: Partial<NFT>): Promise<NFT> {
        const newNFT = this.repository.create(nft);
        return this.repository.save(newNFT);
    }

    async update(id: string, nft: Partial<NFT>): Promise<void> {
        await this.repository.update(id, {
            ...nft,
            updatedAt: new Date()
        });
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async getNFTStats(): Promise<{
        totalNFTs: number;
        stakedNFTs: number;
        uniqueOwners: number;
    }> {
        const [totalNFTs, stakedNFTs, uniqueOwners] = await Promise.all([
            this.repository.count(),
            this.repository.countBy({ isStaked: true }),
            this.repository.createQueryBuilder('nft')
                .select('COUNT(DISTINCT nft.ownerAddress)', 'count')
                .getRawOne()
                .then(result => parseInt(result.count, 10))
        ]);

        return {
            totalNFTs,
            stakedNFTs,
            uniqueOwners
        };
    }
} 