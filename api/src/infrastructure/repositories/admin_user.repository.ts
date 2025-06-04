import { Repository } from 'typeorm';
import { AppDataSource } from '../database';
import { AdminUser } from '../../domain/entities/admin_user.entity';

export class AdminUserRepository {
    private repository: Repository<AdminUser>;

    constructor() {
        this.repository = AppDataSource.getRepository(AdminUser);
    }

    async findByEmail(emailId: string): Promise<AdminUser | null> {
        return this.repository.findOneBy({ emailId });
    }

    async findById(id: number): Promise<AdminUser | null> {
        return this.repository.findOneBy({ id });
    }

    async updateLastLoginIp(id: number, ip: string): Promise<void> {
        await this.repository.update(id, {
            lastloginIp: ip,
            updatedAt: new Date()
        });
    }

    async create(user: Partial<AdminUser>): Promise<AdminUser> {
        const newUser = this.repository.create(user);
        return this.repository.save(newUser);
    }
} 