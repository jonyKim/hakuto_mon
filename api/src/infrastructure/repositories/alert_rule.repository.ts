import { Repository, In } from 'typeorm';
import { AppDataSource } from '../database';
import { AlertRule } from '../../domain/entities/alert_rule.entity';

export class AlertRuleRepository {
    private repository: Repository<AlertRule>;

    constructor() {
        this.repository = AppDataSource.getRepository(AlertRule);
    }

    async findById(id: string): Promise<AlertRule | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['user']
        });
    }

    async findByUserId(userId: string, type?: string, status?: string): Promise<AlertRule[]> {
        const where: any = { userId };
        
        if (type) {
            where.type = type;
        }
        
        if (status) {
            where.status = status;
        }

        return await this.repository.find({
            where,
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });
    }

    async findActiveAlerts(): Promise<AlertRule[]> {
        return await this.repository.find({
            where: { 
                isActive: true,
                status: 'active'
            },
            relations: ['user']
        });
    }

    async findActiveAlertsByType(type: 'price_target' | 'event' | 'portfolio'): Promise<AlertRule[]> {
        return await this.repository.find({
            where: { 
                type,
                isActive: true,
                status: 'active'
            },
            relations: ['user']
        });
    }

    async findByAssetSymbol(assetSymbol: string): Promise<AlertRule[]> {
        return await this.repository.find({
            where: { 
                assetSymbol,
                isActive: true,
                status: 'active'
            },
            relations: ['user']
        });
    }

    async create(alertData: Partial<AlertRule>): Promise<AlertRule> {
        const alert = this.repository.create(alertData);
        return await this.repository.save(alert);
    }

    async update(id: string, alertData: Partial<AlertRule>): Promise<AlertRule | null> {
        await this.repository.update(id, alertData);
        return await this.findById(id);
    }

    async updateStatus(id: string, status: 'active' | 'inactive' | 'paused', isActive: boolean): Promise<AlertRule | null> {
        await this.repository.update(id, { status, isActive });
        return await this.findById(id);
    }

    async updateTriggered(id: string): Promise<AlertRule | null> {
        const alert = await this.findById(id);
        if (alert) {
            alert.triggeredCount += 1;
            alert.lastTriggeredAt = new Date();
            return await this.repository.save(alert);
        }
        return null;
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async count(): Promise<number> {
        return await this.repository.count();
    }

    async countByUserId(userId: string): Promise<number> {
        return await this.repository.count({
            where: { userId }
        });
    }

    async countActiveAlerts(): Promise<number> {
        return await this.repository.count({
            where: { 
                isActive: true,
                status: 'active'
            }
        });
    }

    async countByType(type: 'price_target' | 'event' | 'portfolio'): Promise<number> {
        return await this.repository.count({
            where: { type }
        });
    }

    async findRecentlyTriggered(limit: number = 10): Promise<AlertRule[]> {
        return await this.repository.find({
            where: { 
                lastTriggeredAt: In([null]) // TypeORM에서 NOT NULL 조건
            },
            order: { lastTriggeredAt: 'DESC' },
            take: limit,
            relations: ['user']
        });
    }
}
