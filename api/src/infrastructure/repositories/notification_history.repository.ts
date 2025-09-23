import { Repository, Between } from 'typeorm';
import { AppDataSource } from '../database';
import { NotificationHistory, NotificationStatus, NotificationType } from '../../domain/entities/notification_history.entity';

export class NotificationHistoryRepository {
    private repository: Repository<NotificationHistory>;

    constructor() {
        this.repository = AppDataSource.getRepository(NotificationHistory);
    }

    async findById(id: string): Promise<NotificationHistory | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['user', 'alert']
        });
    }

    async findByUserId(
        userId: string, 
        type?: string, 
        limit: number = 50,
        offset: number = 0
    ): Promise<{ notifications: NotificationHistory[], total: number }> {
        const where: any = { userId };
        
        if (type) {
            where.type = type;
        }

        const [notifications, total] = await this.repository.findAndCount({
            where,
            relations: ['user', 'alert'],
            order: { createdAt: 'DESC' },
            skip: offset,
            take: limit
        });

        return { notifications, total };
    }

    async findByAlertId(alertId: string): Promise<NotificationHistory[]> {
        return await this.repository.find({
            where: { alertId },
            relations: ['user', 'alert'],
            order: { createdAt: 'DESC' }
        });
    }

    async findByStatus(status: NotificationStatus): Promise<NotificationHistory[]> {
        return await this.repository.find({
            where: { status },
            relations: ['user', 'alert'],
            order: { createdAt: 'DESC' }
        });
    }

    async findByDateRange(
        startDate: Date, 
        endDate: Date,
        userId?: string,
        type?: string
    ): Promise<NotificationHistory[]> {
        const where: any = {
            createdAt: Between(startDate, endDate)
        };

        if (userId) {
            where.userId = userId;
        }

        if (type) {
            where.type = type;
        }

        return await this.repository.find({
            where,
            relations: ['user', 'alert'],
            order: { createdAt: 'DESC' }
        });
    }

    async findRecentByUserId(userId: string, limit: number = 20): Promise<NotificationHistory[]> {
        return await this.repository.find({
            where: { userId },
            relations: ['user', 'alert'],
            order: { createdAt: 'DESC' },
            take: limit
        });
    }

    async findPendingNotifications(): Promise<NotificationHistory[]> {
        return await this.repository.find({
            where: { status: NotificationStatus.PENDING },
            relations: ['user', 'alert'],
            order: { createdAt: 'ASC' }
        });
    }

    async findFailedNotifications(): Promise<NotificationHistory[]> {
        return await this.repository.find({
            where: { status: NotificationStatus.FAILED },
            relations: ['user', 'alert'],
            order: { createdAt: 'DESC' }
        });
    }

    async create(notificationData: Partial<NotificationHistory>): Promise<NotificationHistory> {
        const notification = this.repository.create(notificationData);
        return await this.repository.save(notification);
    }

    async update(id: string, notificationData: Partial<NotificationHistory>): Promise<NotificationHistory | null> {
        await this.repository.update(id, notificationData);
        return await this.findById(id);
    }

    async updateStatus(
        id: string, 
        status: NotificationStatus,
        errorMessage?: string
    ): Promise<NotificationHistory | null> {
        const updateData: any = { status };
        
        if (status === 'sent') {
            updateData.sentAt = new Date();
        } else if (status === 'delivered') {
            updateData.deliveredAt = new Date();
        } else if (status === 'failed' && errorMessage) {
            updateData.errorMessage = errorMessage;
        }

        await this.repository.update(id, updateData);
        return await this.findById(id);
    }

    async markAsSent(id: string): Promise<NotificationHistory | null> {
        return await this.updateStatus(id, NotificationStatus.SENT);
    }

    async markAsDelivered(id: string): Promise<NotificationHistory | null> {
        return await this.updateStatus(id, NotificationStatus.DELIVERED);
    }

    async markAsFailed(id: string, errorMessage: string): Promise<NotificationHistory | null> {
        return await this.updateStatus(id, NotificationStatus.FAILED, errorMessage);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.repository.delete({ userId });
    }

    async deleteByAlertId(alertId: string): Promise<void> {
        await this.repository.delete({ alertId });
    }

    async deleteOldRecords(daysOld: number = 90): Promise<void> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        await this.repository.delete({
            createdAt: Between(new Date(0), cutoffDate)
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

    async countByStatus(status: NotificationStatus): Promise<number> {
        return await this.repository.count({
            where: { status }
        });
    }

    async countByType(type: NotificationType): Promise<number> {
        return await this.repository.count({
            where: { type }
        });
    }

    // 통계 및 분석 메서드들
    async getNotificationStats(days: number = 30): Promise<{
        totalSent: number;
        totalDelivered: number;
        totalFailed: number;
        deliveryRate: number;
        failureRate: number;
        byType: { [key: string]: number };
        byChannel: { [key: string]: number };
    }> {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const notifications = await this.findByDateRange(startDate, endDate);

        const totalSent = notifications.filter(n => n.status === 'sent' || n.status === 'delivered').length;
        const totalDelivered = notifications.filter(n => n.status === 'delivered').length;
        const totalFailed = notifications.filter(n => n.status === 'failed').length;

        const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
        const failureRate = notifications.length > 0 ? (totalFailed / notifications.length) * 100 : 0;

        const byType: { [key: string]: number } = {};
        const byChannel: { [key: string]: number } = {};

        notifications.forEach(notification => {
            // 타입별 통계
            byType[notification.type] = (byType[notification.type] || 0) + 1;

            // 채널별 통계
            notification.channels.forEach(channel => {
                byChannel[channel.type] = (byChannel[channel.type] || 0) + 1;
            });
        });

        return {
            totalSent,
            totalDelivered,
            totalFailed,
            deliveryRate,
            failureRate,
            byType,
            byChannel
        };
    }

    async getUserNotificationPreferences(userId: string): Promise<{
        totalReceived: number;
        byType: { [key: string]: number };
        preferredChannels: string[];
        averageResponseTime: number;
    }> {
        const notifications = await this.repository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 100 // 최근 100개 알림 분석
        });

        const totalReceived = notifications.length;
        const byType: { [key: string]: number } = {};
        const channelUsage: { [key: string]: number } = {};

        let totalResponseTime = 0;
        let responseCount = 0;

        notifications.forEach(notification => {
            byType[notification.type] = (byType[notification.type] || 0) + 1;

            notification.channels.forEach(channel => {
                channelUsage[channel.type] = (channelUsage[channel.type] || 0) + 1;
            });

            if (notification.sentAt && notification.deliveredAt) {
                const responseTime = notification.deliveredAt.getTime() - notification.sentAt.getTime();
                totalResponseTime += responseTime;
                responseCount++;
            }
        });

        const preferredChannels = Object.entries(channelUsage)
            .sort(([,a], [,b]) => b - a)
            .map(([channel]) => channel);

        const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

        return {
            totalReceived,
            byType,
            preferredChannels,
            averageResponseTime
        };
    }
}
