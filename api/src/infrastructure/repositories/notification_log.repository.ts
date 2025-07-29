import { Repository, Between, MoreThan } from 'typeorm';
import { AppDataSource } from '../database';
import { NotificationLog, NotificationType, NotificationStatus } from '../../domain/entities/notification_log.entity';

export class NotificationLogRepository {
    private repository: Repository<NotificationLog>;

    constructor() {
        this.repository = AppDataSource.getRepository(NotificationLog);
    }

    async create(data: Partial<NotificationLog>): Promise<NotificationLog> {
        const log = this.repository.create(data);
        return await this.repository.save(log);
    }

    async findById(id: string): Promise<NotificationLog | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['user']
        });
    }

    async updateStatus(
        id: string, 
        status: NotificationStatus, 
        errorMessage?: string
    ): Promise<NotificationLog | null> {
        const updateData: any = { status };
        
        if (status === NotificationStatus.SENT) {
            updateData.sentAt = new Date();
        } else if (status === NotificationStatus.DELIVERED) {
            updateData.deliveredAt = new Date();
        } else if (status === NotificationStatus.FAILED && errorMessage) {
            updateData.errorMessage = errorMessage;
        }

        await this.repository.update(id, updateData);
        return await this.findById(id);
    }

    async findByUserId(
        userId: string, 
        limit?: number, 
        offset?: number
    ): Promise<NotificationLog[]> {
        const query = this.repository
            .createQueryBuilder('log')
            .where('log.userId = :userId', { userId })
            .orderBy('log.createdAt', 'DESC');

        if (limit) {
            query.limit(limit);
        }

        if (offset) {
            query.offset(offset);
        }

        return await query.getMany();
    }

    async findByType(
        type: NotificationType,
        limit?: number,
        offset?: number
    ): Promise<NotificationLog[]> {
        const query = this.repository
            .createQueryBuilder('log')
            .where('log.type = :type', { type })
            .orderBy('log.createdAt', 'DESC');

        if (limit) {
            query.limit(limit);
        }

        if (offset) {
            query.offset(offset);
        }

        return await query.getMany();
    }

    async findByStatus(
        status: NotificationStatus,
        limit?: number,
        offset?: number
    ): Promise<NotificationLog[]> {
        const query = this.repository
            .createQueryBuilder('log')
            .where('log.status = :status', { status })
            .orderBy('log.createdAt', 'DESC');

        if (limit) {
            query.limit(limit);
        }

        if (offset) {
            query.offset(offset);
        }

        return await query.getMany();
    }

    async findByDateRange(
        startDate: Date,
        endDate: Date,
        limit?: number,
        offset?: number
    ): Promise<NotificationLog[]> {
        const query = this.repository
            .createQueryBuilder('log')
            .where('log.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate
            })
            .orderBy('log.createdAt', 'DESC');

        if (limit) {
            query.limit(limit);
        }

        if (offset) {
            query.offset(offset);
        }

        return await query.getMany();
    }

    async getStatsByType(userId?: string): Promise<any> {
        const query = this.repository
            .createQueryBuilder('log')
            .select('log.type', 'type')
            .addSelect('log.status', 'status')
            .addSelect('COUNT(*)', 'count');

        if (userId) {
            query.where('log.userId = :userId', { userId });
        }

        query.groupBy('log.type, log.status');

        return await query.getRawMany();
    }

    async getStatsByDate(days: number = 7, userId?: string): Promise<any> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const query = this.repository
            .createQueryBuilder('log')
            .select('DATE(log.createdAt)', 'date')
            .addSelect('log.type', 'type')
            .addSelect('log.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('log.createdAt >= :startDate', { startDate });

        if (userId) {
            query.andWhere('log.userId = :userId', { userId });
        }

        query.groupBy('DATE(log.createdAt), log.type, log.status')
             .orderBy('date', 'DESC');

        return await query.getRawMany();
    }

    async getPendingNotifications(limit?: number): Promise<NotificationLog[]> {
        const query = this.repository
            .createQueryBuilder('log')
            .where('log.status = :status', { status: NotificationStatus.PENDING })
            .orderBy('log.createdAt', 'ASC');

        if (limit) {
            query.limit(limit);
        }

        return await query.getMany();
    }

    async getFailedNotifications(
        retryableOnly: boolean = true,
        limit?: number
    ): Promise<NotificationLog[]> {
        const query = this.repository
            .createQueryBuilder('log')
            .where('log.status = :status', { status: NotificationStatus.FAILED });

        if (retryableOnly) {
            // 1시간 전 실패한 것들만 재시도 대상으로
            const oneHourAgo = new Date();
            oneHourAgo.setHours(oneHourAgo.getHours() - 1);
            query.andWhere('log.updatedAt <= :oneHourAgo', { oneHourAgo });
        }

        query.orderBy('log.createdAt', 'ASC');

        if (limit) {
            query.limit(limit);
        }

        return await query.getMany();
    }

    async getDeliveryRate(
        type?: NotificationType,
        startDate?: Date,
        endDate?: Date
    ): Promise<any> {
        const query = this.repository
            .createQueryBuilder('log')
            .select('log.status', 'status')
            .addSelect('COUNT(*)', 'count');

        if (type) {
            query.where('log.type = :type', { type });
        }

        if (startDate && endDate) {
            query.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate
            });
        }

        query.groupBy('log.status');

        const results = await query.getRawMany();
        
        const total = results.reduce((sum, item) => sum + parseInt(item.count), 0);
        const delivered = results.find(item => item.status === NotificationStatus.DELIVERED)?.count || 0;
        const sent = results.find(item => item.status === NotificationStatus.SENT)?.count || 0;
        const failed = results.find(item => item.status === NotificationStatus.FAILED)?.count || 0;

        return {
            total,
            delivered: parseInt(delivered),
            sent: parseInt(sent),
            failed: parseInt(failed),
            deliveryRate: total > 0 ? ((parseInt(delivered) + parseInt(sent)) / total * 100).toFixed(2) : 0
        };
    }

    async deleteOldLogs(daysToKeep: number = 90): Promise<void> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        await this.repository
            .createQueryBuilder()
            .delete()
            .where('createdAt < :cutoffDate', { cutoffDate })
            .execute();
    }

    async countByUserId(userId: string): Promise<number> {
        return await this.repository.count({
            where: { userId }
        });
    }

    async findAll(limit?: number, offset?: number): Promise<NotificationLog[]> {
        const query = this.repository
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.user', 'user')
            .orderBy('log.createdAt', 'DESC');

        if (limit) {
            query.limit(limit);
        }

        if (offset) {
            query.offset(offset);
        }

        return await query.getMany();
    }
} 