import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { WalletUser } from './wallet_user.entity';

export enum NotificationType {
    EMAIL = 'email',
    FCM = 'fcm',
    SMS = 'sms'
}

export enum NotificationStatus {
    PENDING = 'pending',
    SENT = 'sent',
    FAILED = 'failed',
    DELIVERED = 'delivered'
}

@Entity('notification_logs')
@Index(['user_id'])
@Index(['type'])
@Index(['status'])
@Index(['created_at'])
export class NotificationLog {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'user_id' })
    userId!: string;

    @ManyToOne(() => WalletUser, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: WalletUser;

    @Column({
        name: 'type',
        type: 'enum',
        enum: NotificationType
    })
    type!: NotificationType;

    @Column({ name: 'title', length: 255 })
    title!: string;

    @Column({ name: 'message', type: 'text' })
    message!: string;

    @Column({
        name: 'status',
        type: 'enum',
        enum: NotificationStatus,
        default: NotificationStatus.PENDING
    })
    status!: NotificationStatus;

    @Column({ name: 'error_message', type: 'text', nullable: true })
    errorMessage?: string;

    @Column({ name: 'sent_at', nullable: true })
    sentAt?: Date;

    @Column({ name: 'delivered_at', nullable: true })
    deliveredAt?: Date;

    @Column({ name: 'metadata', type: 'json', nullable: true })
    metadata?: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
} 