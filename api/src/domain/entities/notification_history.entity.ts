import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { WalletUser } from './wallet_user.entity';
import { AlertRule } from './alert_rule.entity';

export enum NotificationType {
    PRICE_TARGET = 'price_target',
    EVENT = 'event',
    PORTFOLIO = 'portfolio',
    SYSTEM = 'system'
}

export enum NotificationStatus {
    PENDING = 'pending',
    SENT = 'sent',
    DELIVERED = 'delivered',
    FAILED = 'failed'
}

export interface NotificationChannel {
    type: 'push' | 'email' | 'telegram';
    status: 'sent' | 'delivered' | 'failed';
    sentAt?: Date;
    deliveredAt?: Date;
    errorMessage?: string;
}

@Entity('notification_history')
export class NotificationHistory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'alert_id', nullable: true })
    @Index()
    alertId?: string;

    @Column({ name: 'user_id' })
    @Index()
    userId!: string;

    @Column({ 
        type: 'enum',
        enum: NotificationType
    })
    @Index()
    type!: NotificationType;

    @Column({ length: 255 })
    title!: string;

    @Column({ type: 'text' })
    message!: string;

    @Column({ type: 'json' })
    channels!: NotificationChannel[];

    @Column({ 
        type: 'enum',
        enum: NotificationStatus,
        default: NotificationStatus.PENDING
    })
    @Index()
    status!: NotificationStatus;

    @Column({ type: 'json', nullable: true })
    metadata?: any;

    @Column({ name: 'sent_at', type: 'datetime', nullable: true })
    @Index()
    sentAt?: Date;

    @Column({ name: 'delivered_at', type: 'datetime', nullable: true })
    deliveredAt?: Date;

    @Column({ name: 'error_message', type: 'text', nullable: true })
    errorMessage?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @ManyToOne(() => AlertRule, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'alert_id' })
    alert?: AlertRule;

    @ManyToOne(() => WalletUser, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: WalletUser;
}
