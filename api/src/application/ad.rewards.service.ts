import { AdRewardRepository } from '../infrastructure/ad.rewards.repository';
import { AdReward, AdRewardClaim, CreateAdRewardDto, UpdateAdRewardDto, AdRewardStats } from '../types/ad';

export class AdRewardsService {
    constructor(private adRewardRepository: AdRewardRepository) {}

    async getAllAdRewards(): Promise<AdReward[]> {
        return await this.adRewardRepository.findAll();
    }

    async getAdRewardById(id: string): Promise<AdReward | null> {
        return await this.adRewardRepository.findById(id);
    }

    async createAdReward(dto: CreateAdRewardDto, userId: string): Promise<AdReward> {
        // 유효성 검사
        if (dto.min_reward <= 0) {
            throw new Error('Minimum reward must be greater than 0');
        }
        if (dto.max_reward <= 0) {
            throw new Error('Maximum reward must be greater than 0');
        }
        if (dto.min_reward > dto.max_reward) {
            throw new Error('Minimum reward cannot be greater than maximum reward');
        }
        if (dto.daily_limit <= 0) {
            throw new Error('Daily limit must be greater than 0');
        }

        return await this.adRewardRepository.create(dto, userId);
    }

    async updateAdReward(id: string, dto: UpdateAdRewardDto, userId: string): Promise<AdReward> {
        const existingReward = await this.adRewardRepository.findById(id);
        if (!existingReward) {
            throw new Error('Ad reward not found');
        }

        // 유효성 검사
        const newMinReward = dto.min_reward ?? existingReward.min_reward;
        const newMaxReward = dto.max_reward ?? existingReward.max_reward;
        const newDailyLimit = dto.daily_limit ?? existingReward.daily_limit;

        if (newMinReward <= 0) {
            throw new Error('Minimum reward must be greater than 0');
        }
        if (newMaxReward <= 0) {
            throw new Error('Maximum reward must be greater than 0');
        }
        if (newMinReward > newMaxReward) {
            throw new Error('Minimum reward cannot be greater than maximum reward');
        }
        if (newDailyLimit <= 0) {
            throw new Error('Daily limit must be greater than 0');
        }

        return await this.adRewardRepository.update(id, dto, userId);
    }

    async getAdRewardClaims(startDate: Date, endDate: Date): Promise<AdRewardClaim[]> {
        return await this.adRewardRepository.findClaimsByDateRange(startDate, endDate);
    }

    async getAdRewardStats(startDate: Date, endDate: Date): Promise<AdRewardStats> {
        return await this.adRewardRepository.getStats(startDate, endDate);
    }

    async getDailyUserClaims(userId: string, date: Date = new Date()): Promise<number> {
        return await this.adRewardRepository.getDailyUserClaims(userId, date);
    }
} 