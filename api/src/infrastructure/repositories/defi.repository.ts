import { Repository, Between } from 'typeorm';
import { AppDataSource } from '../database';
import { DeFiStake, DeFiReward } from '../../domain/entities/defi.entity';

export class DeFiRepository {
    private stakeRepository: Repository<DeFiStake>;
    private rewardRepository: Repository<DeFiReward>;

    constructor() {
        this.stakeRepository = AppDataSource.getRepository(DeFiStake);
        this.rewardRepository = AppDataSource.getRepository(DeFiReward);
    }

    // Stake 관련 메서드
    async findStakeById(id: string): Promise<DeFiStake | null> {
        return this.stakeRepository.findOne({
            where: { id },
            relations: ['nft']
        });
    }

    async findStakesByNFTId(nftId: string): Promise<DeFiStake[]> {
        return this.stakeRepository.find({
            where: { nftId },
            relations: ['nft']
        });
    }

    async findActiveStakes(): Promise<DeFiStake[]> {
        return this.stakeRepository.find({
            where: { isActive: true },
            relations: ['nft']
        });
    }

    async createStake(stake: Partial<DeFiStake>): Promise<DeFiStake> {
        const newStake = this.stakeRepository.create(stake);
        return this.stakeRepository.save(newStake);
    }

    async updateStake(id: string, stake: Partial<DeFiStake>): Promise<void> {
        await this.stakeRepository.update(id, {
            ...stake,
            updatedAt: new Date()
        });
    }

    async unstake(id: string): Promise<void> {
        await this.stakeRepository.update(id, {
            isActive: false,
            unstakedAt: new Date(),
            updatedAt: new Date()
        });
    }

    // Reward 관련 메서드
    async findRewardsByStakeId(stakeId: string): Promise<DeFiReward[]> {
        return this.rewardRepository.find({
            where: { stakeId },
            relations: ['stake']
        });
    }

    async createReward(reward: Partial<DeFiReward>): Promise<DeFiReward> {
        const newReward = this.rewardRepository.create(reward);
        return this.rewardRepository.save(newReward);
    }

    // 통계 관련 메서드
    async getStakingStats(): Promise<{
        totalStaked: string;
        totalRewards: string;
        activeStakes: number;
        totalStakers: number;
    }> {
        const [totalStaked, totalRewards, activeStakes, totalStakers] = await Promise.all([
            this.stakeRepository
                .createQueryBuilder('stake')
                .select('SUM(stake.amount)', 'total')
                .where('stake.isActive = :isActive', { isActive: true })
                .getRawOne()
                .then(result => result.total || '0'),
            this.stakeRepository
                .createQueryBuilder('stake')
                .select('SUM(stake.totalRewards)', 'total')
                .getRawOne()
                .then(result => result.total || '0'),
            this.stakeRepository.countBy({ isActive: true }),
            this.stakeRepository
                .createQueryBuilder('stake')
                .select('COUNT(DISTINCT stake.stakerAddress)', 'count')
                .getRawOne()
                .then(result => parseInt(result.count, 10))
        ]);

        return {
            totalStaked,
            totalRewards,
            activeStakes,
            totalStakers
        };
    }

    async getDailyRewards(date: Date): Promise<{
        date: Date;
        totalRewards: string;
        rewardCount: number;
    }> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const [totalRewards, rewardCount] = await Promise.all([
            this.rewardRepository
                .createQueryBuilder('reward')
                .select('SUM(reward.amount)', 'total')
                .where('reward.rewardDate BETWEEN :start AND :end', {
                    start: startOfDay,
                    end: endOfDay
                })
                .getRawOne()
                .then(result => result.total || '0'),
            this.rewardRepository.countBy({
                rewardDate: Between(startOfDay, endOfDay)
            })
        ]);

        return {
            date,
            totalRewards,
            rewardCount
        };
    }
} 