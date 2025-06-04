export type AdminUserRole = 'admin' | 'user';

export interface AdminUser {
    id: number;
    uuidAdmin: string;
    name: string;
    emailId: string;
    adminPassword: string;
    adminGrade: AdminUserRole;
    lastloginIp?: string;
    rememberToken?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserWithoutPassword extends Omit<AdminUser, 'adminPassword'> {}

export interface LoginHistory {
    id: string;
    user_id: string;
    success: boolean;
    ip_address: string;
    user_agent: string;
    created_at: Date;
} 