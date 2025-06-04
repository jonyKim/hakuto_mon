import { User, UserWithoutPassword } from '../types/user';
import { JwtPayload } from '../types/jwt';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: UserWithoutPassword;
}

export interface LoginAttemptResult {
    success: boolean;
    remainingAttempts?: number;
    lockoutMinutes?: number;
}

export interface AuthRepository {
    findUserById(userId: string): Promise<User | null>;
    findUserByEmail(email: string): Promise<User | null>;
    findUserByWalletAddress(walletAddress: string): Promise<User | null>;
    updateLoginAttempts(userId: string, attempts: number, lockedUntil?: Date): Promise<void>;
    updateLastLogin(userId: string): Promise<void>;
    createLoginHistory(userId: string, success: boolean, ip: string, userAgent: string): Promise<void>;
}

export type { JwtPayload }; 