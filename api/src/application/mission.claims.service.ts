import { MissionClaimsRepository } from '../infrastructure/mission.claims.repository';
import { MissionRewardClaim, MissionRewardClaimStatistics, MissionRewardClaimStatus } from '../types/mission.claim';

export class MissionClaimsService {
    constructor(private readonly missionClaimRepository: MissionClaimsRepository) {}

    /**
     * 날짜 문자열을 KST 형식으로 변환 (YYYY-MM-DD HH:mm:ss)
     */
    private formatToKST(date: Date): string {
        return date.toLocaleString('sv', { timeZone: 'Asia/Seoul' }).replace(',', '');
    }

    async getAllClaims(): Promise<MissionRewardClaim[]> {
        return await this.missionClaimRepository.findAll();
    }
    
    async getClaimsHistory(): Promise<MissionRewardClaim[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return await this.getClaimsByDateRange(today, today);
    }

    async getClaimsByDateRange(startDate: Date, endDate: Date): Promise<MissionRewardClaim[]> {
        const startDateStr = this.formatToKST(startDate);
        const endDateStr = this.formatToKST(endDate);
        return await this.missionClaimRepository.findClaimsByDateRange(startDateStr, endDateStr);
    }

    async getClaimById(id: string): Promise<MissionRewardClaim> {
        const claim = await this.missionClaimRepository.findClaimById(id);
        if (!claim) {
            throw new Error('Claim not found');
        }
        return claim;
    }

    async updateClaimStatus(
        id: string, 
        status: MissionRewardClaimStatus, 
        transactionHash?: string
    ): Promise<MissionRewardClaim> {
        const claim = await this.missionClaimRepository.findClaimById(id);
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

        return await this.missionClaimRepository.updateClaimStatus(id, status, transactionHash);
    }

    async getClaimsStatistics(startDate: Date, endDate: Date): Promise<MissionRewardClaimStatistics> {
        const startDateStr = this.formatToKST(startDate);
        const endDateStr = this.formatToKST(endDate);
        return await this.missionClaimRepository.getClaimsStatistics(startDateStr, endDateStr);
    }
} 