export type UserRole = 'admin' | 'user';

export interface User {
    id: string;
    wallet_address: string;
    name: string;
    email: string;
    password_hash?: string;
    role: UserRole;
    is_active: boolean;
    last_login_at?: Date;
    login_attempts?: number;
    locked_until?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface UserWithoutPassword extends Omit<User, 'password_hash'> {}

export interface LoginHistory {
    id: string;
    user_id: string;
    success: boolean;
    ip_address: string;
    user_agent: string;
    created_at: Date;
} 