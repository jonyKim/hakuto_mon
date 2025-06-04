import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'wallet_address', unique: true })
    walletAddress!: string;

    @Column({ nullable: true })
    email!: string | null;

    @Column({ type: 'enum', enum: ['admin', 'user'], default: 'user' })
    role!: 'admin' | 'user';

    @Column({ nullable: true })
    name!: string | null;

    @Column({ name: 'is_active', default: true })
    isActive!: boolean;

    @Column({ name: 'password_hash', nullable: true })
    passwordHash!: string | null;

    @Column({ name: 'login_attempts', default: 0 })
    loginAttempts!: number;

    @Column({ name: 'locked_until', nullable: true })
    lockedUntil!: Date | null;

    @Column({ name: 'last_login', nullable: true })
    lastLogin!: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
} 