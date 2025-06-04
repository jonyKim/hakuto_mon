import { AdminUserRepository } from './repositories/admin_user.repository';
import { AdminUser } from '../domain/entities/admin_user.entity';

export class AdminAuthRepository {
    private readonly repo: AdminUserRepository;

    constructor() {
        this.repo = new AdminUserRepository();
    }

    async findUserByEmail(emailId: string): Promise<AdminUser | null> {
        return this.repo.findByEmail(emailId);
    }

    async findUserById(id: number): Promise<AdminUser | null> {
        return this.repo.findById(id);
    }

    async updateLastLoginIp(id: number, ip: string): Promise<void> {
        await this.repo.updateLastLoginIp(id, ip);
    }
} 