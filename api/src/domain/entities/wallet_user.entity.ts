import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('wallet_users')
export class WalletUser {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'wallet_address', length: 42, unique: true })
    @Index()
    walletAddress!: string;

    @Column({ name: 'email', length: 255, nullable: true, unique: true })
    @Index()
    email?: string;

    @Column({ name: 'email_verified', default: false })
    @Index()
    emailVerified!: boolean;

    @Column({ name: 'fcm_token', type: 'text', nullable: true })
    fcmToken?: string;

    @Column({ name: 'verification_token', length: 6, nullable: true })
    @Index()
    verificationToken?: string;

    @Column({ name: 'verification_expires_at', type: 'datetime', nullable: true })
    verificationExpiresAt?: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
} 