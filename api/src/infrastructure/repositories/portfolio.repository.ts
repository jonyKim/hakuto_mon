import { Repository } from 'typeorm';
import { AppDataSource } from '../database';
import { Portfolio } from '../../domain/entities/portfolio.entity';

export class PortfolioRepository {
    private repository: Repository<Portfolio>;

    constructor() {
        this.repository = AppDataSource.getRepository(Portfolio);
    }

    async findById(id: string): Promise<Portfolio | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['user']
        });
    }

    async findByUserId(userId: string): Promise<Portfolio | null> {
        return await this.repository.findOne({
            where: { userId },
            relations: ['user']
        });
    }

    async findAll(limit?: number, offset?: number): Promise<Portfolio[]> {
        const queryBuilder = this.repository.createQueryBuilder('portfolio')
            .leftJoinAndSelect('portfolio.user', 'user')
            .orderBy('portfolio.lastUpdated', 'DESC');
        
        if (limit) {
            queryBuilder.limit(limit);
        }
        
        if (offset) {
            queryBuilder.offset(offset);
        }

        return await queryBuilder.getMany();
    }

    async findOutdatedPortfolios(minutesOld: number = 30): Promise<Portfolio[]> {
        const cutoffTime = new Date(Date.now() - minutesOld * 60 * 1000);
        
        return await this.repository.createQueryBuilder('portfolio')
            .leftJoinAndSelect('portfolio.user', 'user')
            .where('portfolio.lastUpdated < :cutoffTime', { cutoffTime })
            .getMany();
    }

    async create(portfolioData: Partial<Portfolio>): Promise<Portfolio> {
        const portfolio = this.repository.create(portfolioData);
        return await this.repository.save(portfolio);
    }

    async update(id: string, portfolioData: Partial<Portfolio>): Promise<Portfolio | null> {
        await this.repository.update(id, portfolioData);
        return await this.findById(id);
    }

    async updateByUserId(userId: string, portfolioData: Partial<Portfolio>): Promise<Portfolio | null> {
        await this.repository.update({ userId }, portfolioData);
        return await this.findByUserId(userId);
    }

    async upsertByUserId(userId: string, portfolioData: Partial<Portfolio>): Promise<Portfolio> {
        const existing = await this.findByUserId(userId);
        
        if (existing) {
            await this.repository.update({ userId }, portfolioData);
            return await this.findByUserId(userId) as Portfolio;
        } else {
            return await this.create({ ...portfolioData, userId });
        }
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.repository.delete({ userId });
    }

    async count(): Promise<number> {
        return await this.repository.count();
    }

    // 통계 관련 메서드들
    async getTotalPortfolioValue(): Promise<number> {
        const result = await this.repository
            .createQueryBuilder('portfolio')
            .select('SUM(portfolio.totalValue)', 'total')
            .getRawOne();
        
        return parseFloat(result?.total || '0');
    }

    async getAveragePortfolioValue(): Promise<number> {
        const result = await this.repository
            .createQueryBuilder('portfolio')
            .select('AVG(portfolio.totalValue)', 'average')
            .getRawOne();
        
        return parseFloat(result?.average || '0');
    }

    async getPortfoliosByValueRange(minValue: number, maxValue: number): Promise<Portfolio[]> {
        return await this.repository
            .createQueryBuilder('portfolio')
            .leftJoinAndSelect('portfolio.user', 'user')
            .where('portfolio.totalValue >= :minValue', { minValue })
            .andWhere('portfolio.totalValue <= :maxValue', { maxValue })
            .orderBy('portfolio.totalValue', 'DESC')
            .getMany();
    }

    async getTopPortfoliosByValue(limit: number = 10): Promise<Portfolio[]> {
        return await this.repository.find({
            relations: ['user'],
            order: { totalValue: 'DESC' },
            take: limit
        });
    }

    async getPortfoliosWithProfit(): Promise<Portfolio[]> {
        return await this.repository
            .createQueryBuilder('portfolio')
            .leftJoinAndSelect('portfolio.user', 'user')
            .where('portfolio.profitLoss > 0')
            .orderBy('portfolio.profitLossPercentage', 'DESC')
            .getMany();
    }

    async getPortfoliosWithLoss(): Promise<Portfolio[]> {
        return await this.repository
            .createQueryBuilder('portfolio')
            .leftJoinAndSelect('portfolio.user', 'user')
            .where('portfolio.profitLoss < 0')
            .orderBy('portfolio.profitLossPercentage', 'ASC')
            .getMany();
    }

    async updateLastUpdated(userId: string): Promise<void> {
        await this.repository.update(
            { userId }, 
            { lastUpdated: new Date() }
        );
    }
}
