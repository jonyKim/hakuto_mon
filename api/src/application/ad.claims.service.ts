import { AdClaimRepository } from '../infrastructure/ad.claims.repository';
import { AdRewardClaim, AdRewardClaimStatistics, AdRewardClaimStatus } from '../types/ad.claim';

export class AdClaimsService {
    constructor(private readonly adClaimRepository: AdClaimRepository) {}

    async getClaimsByDateRange(startDate: Date, endDate: Date): Promise<AdRewardClaim[]> {
        return await this.adClaimRepository.findClaimsByDateRange(startDate, endDate);
    }

    async getClaimById(id: string): Promise<AdRewardClaim> {
        const claim = await this.adClaimRepository.findClaimById(id);
        if (!claim) {
            throw new Error('Claim not found');
        }
        return claim;
    }

    async updateClaimStatus(
        id: string, 
        status: AdRewardClaimStatus, 
        transactionHash?: string
    ): Promise<AdRewardClaim> {
        const claim = await this.adClaimRepository.findClaimById(id);
        if (!claim) {
            throw new Error('Claim not found');
        }

        // 상태 변경 유효성 검사
        if (claim.claim_status === 'COMPLETED' && status !== 'FAILED') {
            throw new Error('Cannot modify completed claim');
        }

        // 트랜잭션 해시 유효성 검사
        if (status === 'COMPLETED' && !transactionHash) {
            throw new Error('Transaction hash is required for completed status');
        }

        return await this.adClaimRepository.updateClaimStatus(id, status, transactionHash);
    }

    async getClaimsStatistics(startDate: Date, endDate: Date): Promise<AdRewardClaimStatistics> {
        return await this.adClaimRepository.getClaimsStatistics(startDate, endDate);
    }
} 