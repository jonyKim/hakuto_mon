import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { WalletUser } from './wallet_user.entity';

@Entity('email_verification_attempts')
@Index(['email'])
@Index(['verification_code'])
@Index(['expires_at'])
export class EmailVerificationAttempt {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'user_id' })
    userId!: string;

    @ManyToOne(() => WalletUser, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: WalletUser;

    @Column({ name: 'email', length: 255 })
    email!: string;

    @Column({ name: 'verification_code', length: 6 })
    verificationCode!: string;

    @Column({ name: 'attempts_count', default: 0 })
    attemptsCount!: number;

    @Column({ name: 'is_verified', default: false })
    isVerified!: boolean;

    @Column({ name: 'expires_at' })
    expiresAt!: Date;

    @Column({ name: 'verified_at', nullable: true })
    verifiedAt?: Date;

    @Column({ name: 'ip_address', length: 45, nullable: true })
    ipAddress?: string;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
} 