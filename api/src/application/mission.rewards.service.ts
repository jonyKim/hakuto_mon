import { MissionRewardRepository } from '../infrastructure/mission.rewards.repository';
import { MissionReward, MissionRewardClaim, CreateMissionRewardDto, UpdateMissionRewardDto, MissionRewardStats } from '../types/mission';

export class MissionRewardsService {
    constructor(private missionRewardRepository: MissionRewardRepository) {}

    async getAllMissionRewards(): Promise<MissionReward[]> {
        return await this.missionRewardRepository.findAll();
    }

    async getMissionRewardById(id: string): Promise<MissionReward | null> {
        return await this.missionRewardRepository.findById(id);
    }

    async createMissionReward(dto: CreateMissionRewardDto, userId: string): Promise<MissionReward> {
        // 유효성 검사
        if (dto.steps <= 0) {
            throw new Error('Steps must be greater than 0');
        }
        if (dto.reward <= 0) {
            throw new Error('Reward must be greater than 0');
        }

        return await this.missionRewardRepository.create(dto, userId);
    }

    async updateMissionReward(id: string, dto: UpdateMissionRewardDto, userId: string): Promise<MissionReward> {
        const existingReward = await this.missionRewardRepository.findById(id);
        if (!existingReward) {
            throw new Error('Mission reward not found');
        }

        // 유효성 검사
        if (dto.steps !== undefined && dto.steps <= 0) {
            throw new Error('Steps must be greater than 0');
        }
        if (dto.reward !== undefined && dto.reward <= 0) {
            throw new Error('Reward must be greater than 0');
        }

        return await this.missionRewardRepository.update(id, dto, userId);
    }

    async getMissionRewardClaims(startDate: Date, endDate: Date): Promise<MissionRewardClaim[]> {
        return await this.missionRewardRepository.findClaimsByDateRange(startDate, endDate);
    }

    async getMissionRewardStats(startDate: Date, endDate: Date): Promise<MissionRewardStats> {
        return await this.missionRewardRepository.getStats(startDate, endDate);
    }
} 