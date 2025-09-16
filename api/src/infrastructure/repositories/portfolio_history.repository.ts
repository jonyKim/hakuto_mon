import { Repository, Between } from 'typeorm';
import { AppDataSource } from '../database';
import { PortfolioHistory } from '../../domain/entities/portfolio_history.entity';

export class PortfolioHistoryRepository {
    private repository: Repository<PortfolioHistory>;

    constructor() {
        this.repository = AppDataSource.getRepository(PortfolioHistory);
    }

    async findById(id: string): Promise<PortfolioHistory | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['user']
        });
    }

    async findByUserId(userId: string, limit?: number): Promise<PortfolioHistory[]> {
        const queryBuilder = this.repository.createQueryBuilder('history')
            .leftJoinAndSelect('history.user', 'user')
            .where('history.userId = :userId', { userId })
            .orderBy('history.snapshotDate', 'DESC');
        
        if (limit) {
            queryBuilder.limit(limit);
        }

        return await queryBuilder.getMany();
    }

    async findByUserIdAndDateRange(
        userId: string, 
        startDate: Date, 
        endDate: Date
    ): Promise<PortfolioHistory[]> {
        return await this.repository.find({
            where: {
                userId,
                snapshotDate: Between(startDate, endDate)
            },
            relations: ['user'],
            order: { snapshotDate: 'ASC' }
        });
    }

    async findByDate(date: Date): Promise<PortfolioHistory[]> {
        return await this.repository.find({
            where: { snapshotDate: date },
            relations: ['user'],
            order: { totalValue: 'DESC' }
        });
    }

    async findLatestByUserId(userId: string): Promise<PortfolioHistory | null> {
        return await this.repository.findOne({
            where: { userId },
            relations: ['user'],
            order: { snapshotDate: 'DESC' }
        });
    }

    async findExistingSnapshot(userId: string, date: Date): Promise<PortfolioHistory | null> {
        return await this.repository.findOne({
            where: { 
                userId,
                snapshotDate: date
            }
        });
    }

    async create(historyData: Partial<PortfolioHistory>): Promise<PortfolioHistory> {
        const history = this.repository.create(historyData);
        return await this.repository.save(history);
    }

    async createOrUpdate(historyData: Partial<PortfolioHistory>): Promise<PortfolioHistory> {
        const existing = await this.findExistingSnapshot(
            historyData.userId!,
            historyData.snapshotDate!
        );

        if (existing) {
            await this.repository.update(existing.id, historyData);
            return await this.findById(existing.id) as PortfolioHistory;
        } else {
            return await this.create(historyData);
        }
    }

    async update(id: string, historyData: Partial<PortfolioHistory>): Promise<PortfolioHistory | null> {
        await this.repository.update(id, historyData);
        return await this.findById(id);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.repository.delete({ userId });
    }

    async deleteOldRecords(daysOld: number = 365): Promise<void> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        await this.repository.delete({
            snapshotDate: Between(new Date(0), cutoffDate)
        });
    }

    async count(): Promise<number> {
        return await this.repository.count();
    }

    async countByUserId(userId: string): Promise<number> {
        return await this.repository.count({
            where: { userId }
        });
    }

    // 통계 및 분석 메서드들
    async getUserPerformanceStats(userId: string, days: number = 30): Promise<{
        totalReturn: number;
        totalReturnPercentage: number;
        bestDay: PortfolioHistory | null;
        worstDay: PortfolioHistory | null;
        averageValue: number;
    }> {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const records = await this.findByUserIdAndDateRange(userId, startDate, endDate);
        
        if (records.length === 0) {
            return {
                totalReturn: 0,
                totalReturnPercentage: 0,
                bestDay: null,
                worstDay: null,
                averageValue: 0
            };
        }

        const firstRecord = records[0];
        const lastRecord = records[records.length - 1];
        
        const totalReturn = lastRecord.totalValue - firstRecord.totalValue;
        const totalReturnPercentage = firstRecord.totalValue > 0 
            ? (totalReturn / firstRecord.totalValue) * 100 
            : 0;

        const bestDay = records.reduce((best, current) => 
            current.profitLoss > best.profitLoss ? current : best
        );

        const worstDay = records.reduce((worst, current) => 
            current.profitLoss < worst.profitLoss ? current : worst
        );

        const averageValue = records.reduce((sum, record) => sum + record.totalValue, 0) / records.length;

        return {
            totalReturn,
            totalReturnPercentage,
            bestDay,
            worstDay,
            averageValue
        };
    }

    async getMarketOverview(date: Date): Promise<{
        totalUsers: number;
        totalValue: number;
        averageValue: number;
        topPerformers: PortfolioHistory[];
        bottomPerformers: PortfolioHistory[];
    }> {
        const records = await this.findByDate(date);
        
        const totalUsers = records.length;
        const totalValue = records.reduce((sum, record) => sum + record.totalValue, 0);
        const averageValue = totalUsers > 0 ? totalValue / totalUsers : 0;

        const topPerformers = records
            .sort((a, b) => b.profitLossPercentage - a.profitLossPercentage)
            .slice(0, 10);

        const bottomPerformers = records
            .sort((a, b) => a.profitLossPercentage - b.profitLossPercentage)
            .slice(0, 10);

        return {
            totalUsers,
            totalValue,
            averageValue,
            topPerformers,
            bottomPerformers
        };
    }
}
