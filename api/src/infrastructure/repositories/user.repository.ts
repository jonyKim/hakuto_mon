import { Repository } from 'typeorm';
import { AppDataSource } from '../database';
import { User } from '../../domain/entities/user.entity';

export class UserRepository {
    private repository: Repository<User>;

    constructor() {
        this.repository = AppDataSource.getRepository(User);
    }

    async findById(id: string): Promise<User | null> {
        return this.repository.findOneBy({ id });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.repository.findOneBy({ email });
    }

    async findByWalletAddress(walletAddress: string): Promise<User | null> {
        return this.repository.findOneBy({ walletAddress });
    }

    async updateLoginAttempts(id: string, attempts: number, lockedUntil?: Date): Promise<void> {
        await this.repository.update(id, {
            loginAttempts: attempts,
            lockedUntil,
            updatedAt: new Date()
        });
    }

    async updateLastLogin(id: string): Promise<void> {
        await this.repository.update(id, {
            lastLogin: new Date(),
            loginAttempts: 0,
            lockedUntil: null,
            updatedAt: new Date()
        });
    }

    async create(user: Partial<User>): Promise<User> {
        const newUser = this.repository.create(user);
        return this.repository.save(newUser);
    }

    async update(id: string, user: Partial<User>): Promise<void> {
        await this.repository.update(id, {
            ...user,
            updatedAt: new Date()
        });
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
} 