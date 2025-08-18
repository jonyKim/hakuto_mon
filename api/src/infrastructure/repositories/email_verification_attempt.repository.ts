import { Repository, MoreThan } from 'typeorm';
import { AppDataSource } from '../database';
import { EmailVerificationAttempt } from '../../domain/entities/email_verification_attempt.entity';

export class EmailVerificationAttemptRepository {
    private repository: Repository<EmailVerificationAttempt>;

    constructor() {
        this.repository = AppDataSource.getRepository(EmailVerificationAttempt);
    }

    async create(data: Partial<EmailVerificationAttempt>): Promise<EmailVerificationAttempt> {
        const attempt = this.repository.create(data);
        return await this.repository.save(attempt);
    }

    async findById(id: string): Promise<EmailVerificationAttempt | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['user']
        });
    }

    async findByVerificationCode(code: string): Promise<EmailVerificationAttempt | null> {
        return await this.repository.findOne({
            where: { 
                verificationCode: code,
                isVerified: false,
                expiresAt: MoreThan(new Date())
            },
            relations: ['user']
        });
    }

    async findByUserId(userId: string): Promise<EmailVerificationAttempt | null> {
        return await this.repository.findOne({
            where: { 
                userId,
                isVerified: false,
                expiresAt: MoreThan(new Date())
            },
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });
    }

    async findByUserIdAndEmail(userId: string, email: string): Promise<EmailVerificationAttempt | null> {
        return await this.repository.findOne({
            where: { 
                userId,
                email,
                isVerified: false,
                expiresAt: MoreThan(new Date())
            },
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });
    }

    async findActiveAttemptsByEmail(email: string): Promise<EmailVerificationAttempt[]> {
        return await this.repository.find({
            where: {
                email,
                isVerified: false,
                expiresAt: MoreThan(new Date())
            },
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });
    }

    async incrementAttempts(id: string): Promise<EmailVerificationAttempt | null> {
        await this.repository.increment({ id }, 'attemptsCount', 1);
        return await this.findById(id);
    }

    async markAsVerified(id: string): Promise<EmailVerificationAttempt | null> {
        await this.repository.update(id, {
            isVerified: true,
            verifiedAt: new Date()
        });
        return await this.findById(id);
    }

    async deleteExpiredAttempts(): Promise<void> {
        await this.repository.delete({
            expiresAt: MoreThan(new Date())
        });
    }

    async getAttemptsByUserInTimeRange(userId: string, hours: number): Promise<EmailVerificationAttempt[]> {
        const since = new Date();
        since.setHours(since.getHours() - hours);

        return await this.repository.find({
            where: {
                userId,
                createdAt: MoreThan(since)
            },
            order: { createdAt: 'DESC' }
        });
    }

    async getAttemptsByEmailInTimeRange(email: string, hours: number): Promise<EmailVerificationAttempt[]> {
        const since = new Date();
        since.setHours(since.getHours() - hours);

        return await this.repository.find({
            where: {
                email,
                createdAt: MoreThan(since)
            },
            order: { createdAt: 'DESC' }
        });
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.repository.delete({ userId });
    }
} 