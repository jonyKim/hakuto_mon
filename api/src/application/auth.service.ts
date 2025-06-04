import { AdminAuthRepository } from '../infrastructure/auth.repository';
import { AdminUser } from '../domain/entities/admin_user.entity';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface AuthResult {
    token: string;
    user: {
        id: number;
        uuidAdmin: string;
        name: string;
        emailId: string;
        adminGrade: string;
    };
}

export class AuthService {
    private readonly authRepository: AdminAuthRepository;
    private readonly jwtSecret: string;

    constructor(authRepository?: AdminAuthRepository) {
        this.authRepository = authRepository || new AdminAuthRepository();
        this.jwtSecret = process.env.JWT_SECRET || 'dev-secret';
    }

    async login(emailId: string, password: string, ip: string, userAgent: string): Promise<AuthResult> {
        const user = await this.authRepository.findUserByEmail(emailId);
        if (!user) throw new Error('존재하지 않는 계정입니다.');
        const isValid = await bcrypt.compare(password, user.adminPassword);
        if (!isValid) throw new Error('비밀번호가 일치하지 않습니다.');
        await this.authRepository.updateLastLoginIp(user.id, ip);
        const token = this.generateToken(user);
        return {
            token,
            user: {
                id: user.id,
                uuidAdmin: user.uuidAdmin,
                name: user.name,
                emailId: user.emailId,
                adminGrade: user.adminGrade,
            }
        };
    }

    async refreshSession(userId: number): Promise<AuthResult> {
        const user = await this.authRepository.findUserById(userId);
        if (!user) throw new Error('존재하지 않는 계정입니다.');
        const token = this.generateToken(user);
        return {
            token,
            user: {
                id: user.id,
                uuidAdmin: user.uuidAdmin,
                name: user.name,
                emailId: user.emailId,
                adminGrade: user.adminGrade,
            }
        };
    }

    private generateToken(user: AdminUser): string {
        return jwt.sign(
            {
                id: user.id,
                uuidAdmin: user.uuidAdmin,
                email: user.emailId,
                role: user.adminGrade,
            },
            this.jwtSecret,
            { expiresIn: '24h' }
        );
    }

    async findUserById(userId: number): Promise<AdminUser | null> {
        return this.authRepository.findUserById(userId);
    }
} 