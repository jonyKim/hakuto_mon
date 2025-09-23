import { Repository } from 'typeorm';
import { AppDataSource } from '../database';
import { TelegramConnection } from '../../domain/entities/telegram_connection.entity';

export class TelegramConnectionRepository {
    private repository: Repository<TelegramConnection>;

    constructor() {
        this.repository = AppDataSource.getRepository(TelegramConnection);
    }

    async findById(id: string): Promise<TelegramConnection | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['user']
        });
    }

    async findByUserId(userId: string): Promise<TelegramConnection | null> {
        return await this.repository.findOne({
            where: { userId },
            relations: ['user']
        });
    }

    async findByChatId(chatId: string): Promise<TelegramConnection | null> {
        return await this.repository.findOne({
            where: { chatId },
            relations: ['user']
        });
    }

    async findByConnectionCode(connectionCode: string): Promise<TelegramConnection | null> {
        return await this.repository.findOne({
            where: { 
                connectionCode,
                codeExpiresAt: new Date() // 만료되지 않은 코드만
            },
            relations: ['user']
        });
    }

    async findActiveConnections(): Promise<TelegramConnection[]> {
        return await this.repository.find({
            where: { isActive: true },
            relations: ['user'],
            order: { connectedAt: 'DESC' }
        });
    }

    async findExpiredCodes(): Promise<TelegramConnection[]> {
        return await this.repository.createQueryBuilder('connection')
            .leftJoinAndSelect('connection.user', 'user')
            .where('connection.connectionCode IS NOT NULL')
            .andWhere('connection.codeExpiresAt < :now', { now: new Date() })
            .getMany();
    }

    async create(connectionData: Partial<TelegramConnection>): Promise<TelegramConnection> {
        const connection = this.repository.create(connectionData);
        return await this.repository.save(connection);
    }

    async update(id: string, connectionData: Partial<TelegramConnection>): Promise<TelegramConnection | null> {
        await this.repository.update(id, connectionData);
        return await this.findById(id);
    }

    async updateByUserId(userId: string, connectionData: Partial<TelegramConnection>): Promise<TelegramConnection | null> {
        await this.repository.update({ userId }, connectionData);
        return await this.findByUserId(userId);
    }

    async setConnectionCode(userId: string, code: string, expiresAt: Date): Promise<TelegramConnection | null> {
        let connection = await this.findByUserId(userId);
        
        if (!connection) {
            connection = await this.create({
                userId,
                connectionCode: code,
                codeExpiresAt: expiresAt,
                isActive: false,
                connectedAt: new Date(),
                chatId: '' // 연결 완료 시 설정됨
            });
        } else {
            await this.repository.update(connection.id, {
                connectionCode: code,
                codeExpiresAt: expiresAt
            });
            connection = await this.findById(connection.id);
        }
        
        return connection;
    }

    async connectUser(code: string, chatId: string, username?: string): Promise<TelegramConnection | null> {
        const connection = await this.findByConnectionCode(code);
        
        if (connection && connection.codeExpiresAt && connection.codeExpiresAt > new Date()) {
            await this.repository.update(connection.id, {
                chatId,
                username,
                isActive: true,
                connectedAt: new Date(),
                connectionCode: undefined, // 코드 사용 완료
                codeExpiresAt: undefined,
                lastMessageAt: new Date()
            });
            
            return await this.findById(connection.id);
        }
        
        return null;
    }

    async disconnect(userId: string): Promise<void> {
        await this.repository.update(
            { userId },
            { 
                isActive: false,
                connectionCode: undefined,
                codeExpiresAt: undefined
            }
        );
    }

    async updateLastMessageTime(chatId: string): Promise<void> {
        await this.repository.update(
            { chatId },
            { lastMessageAt: new Date() }
        );
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.repository.delete({ userId });
    }

    async cleanupExpiredCodes(): Promise<void> {
        await this.repository.update(
            {
                connectionCode: undefined,
                codeExpiresAt: undefined
            },
            {
                connectionCode: undefined,
                codeExpiresAt: undefined
            }
        );
    }

    async count(): Promise<number> {
        return await this.repository.count();
    }

    async countActiveConnections(): Promise<number> {
        return await this.repository.count({
            where: { isActive: true }
        });
    }

    async countByUsername(username: string): Promise<number> {
        return await this.repository.count({
            where: { username }
        });
    }

    // 통계 관련 메서드들
    async getConnectionStats(): Promise<{
        totalConnections: number;
        activeConnections: number;
        pendingCodes: number;
        recentConnections: TelegramConnection[];
    }> {
        const totalConnections = await this.count();
        const activeConnections = await this.countActiveConnections();
        
        const pendingCodes = await this.repository.count({
            where: {
                connectionCode: undefined, // NOT NULL 조건
                codeExpiresAt: undefined,  // NOT NULL 조건
                isActive: false
            }
        });

        const recentConnections = await this.repository.find({
            where: { isActive: true },
            relations: ['user'],
            order: { connectedAt: 'DESC' },
            take: 10
        });

        return {
            totalConnections,
            activeConnections,
            pendingCodes,
            recentConnections
        };
    }
}
