import { Repository, Not, IsNull, Between } from 'typeorm';
import { AppDataSource } from '../database';
import { WalletUser } from '../../domain/entities/wallet_user.entity';

export class WalletUserRepository {
    private repository: Repository<WalletUser>;

    constructor() {
        this.repository = AppDataSource.getRepository(WalletUser);
    }

    async findByWalletAddress(walletAddress: string): Promise<WalletUser | null> {
        return await this.repository.findOne({
            where: { walletAddress }
        });
    }

    async findByEmail(email: string): Promise<WalletUser | null> {
        return await this.repository.findOne({
            where: { email }
        });
    }

    async findById(id: string): Promise<WalletUser | null> {
        return await this.repository.findOne({
            where: { id }
        });
    }

    async findByVerificationToken(token: string): Promise<WalletUser | null> {
        return await this.repository.findOne({
            where: { verificationToken: token }
        });
    }

    async create(userData: Partial<WalletUser>): Promise<WalletUser> {
        const user = this.repository.create(userData);
        return await this.repository.save(user);
    }

    async update(id: string, userData: Partial<WalletUser>): Promise<WalletUser | null> {
        await this.repository.update(id, userData);
        return await this.findById(id);
    }

    async updateEmail(id: string, email: string): Promise<WalletUser | null> {
        await this.repository.update(id, { email });
        return await this.findById(id);
    }

    async updateEmailVerification(id: string, emailVerified: boolean): Promise<WalletUser | null> {
        await this.repository.update(id, { 
            emailVerified,
            verificationToken: undefined,
            verificationExpiresAt: undefined
        });
        return await this.findById(id);
    }

    async updateFcmToken(id: string, fcmToken: string): Promise<WalletUser | null> {
        await this.repository.update(id, { fcmToken });
        return await this.findById(id);
    }

    async setVerificationToken(id: string, token: string, expiresAt: Date): Promise<WalletUser | null> {
        await this.repository.update(id, { 
            verificationToken: token,
            verificationExpiresAt: expiresAt
        });
        return await this.findById(id);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async findAll(limit?: number, offset?: number): Promise<WalletUser[]> {
        const queryBuilder = this.repository.createQueryBuilder('wallet_user');
        
        if (limit) {
            queryBuilder.limit(limit);
        }
        
        if (offset) {
            queryBuilder.offset(offset);
        }

        return await queryBuilder.getMany();
    }

    async count(): Promise<number> {
        return await this.repository.count();
    }

    // 통계 관련 메서드들
    async getVerifiedUsersCount(): Promise<number> {
        return await this.repository.count({
            where: { emailVerified: true }
        });
    }

    async getUnverifiedUsersCount(): Promise<number> {
        return await this.repository.count({
            where: { emailVerified: false }
        });
    }

    async getUsersWithFcmTokenCount(): Promise<number> {
        return await this.repository.count({
            where: { fcmToken: Not(IsNull()) }
        });
    }

    async getTodayRegistrationsCount(): Promise<number> {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        return await this.repository.count({
            where: {
                createdAt: Between(startOfDay, endOfDay)
            }
        });
    }
} 