import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { WalletUser } from './wallet_user.entity';

export interface AlertCondition {
    type: 'above' | 'below' | 'both' | 'percentage_change' | 'portfolio_value' | 'profit_loss';
    value: number;
    comparison?: 'greater_than' | 'less_than' | 'equals';
    timeframe?: '1h' | '24h' | '7d' | '30d';
}

export interface AlertChannel {
    type: 'push' | 'email' | 'telegram';
    enabled: boolean;
    settings?: {
        sound?: boolean;
        vibration?: boolean;
        priority?: 'low' | 'normal' | 'high';
    };
}

@Entity('alert_rules')
export class AlertRule {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'user_id' })
    @Index()
    userId!: string;

    @Column({ 
        type: 'enum', 
        enum: ['price_target', 'event', 'portfolio'] 
    })
    @Index()
    type!: 'price_target' | 'event' | 'portfolio';

    @Column({ length: 255 })
    name!: string;

    @Column({ name: 'asset_symbol', length: 20, nullable: true })
    @Index()
    assetSymbol?: string;

    @Column({ type: 'json' })
    conditions!: AlertCondition[];

    @Column({ type: 'json' })
    channels!: AlertChannel[];

    @Column({ 
        type: 'enum',
        enum: ['immediate', '5min', '1hour', 'daily'],
        default: 'immediate'
    })
    frequency!: 'immediate' | '5min' | '1hour' | 'daily';

    @Column({ name: 'is_active', default: true })
    @Index()
    isActive!: boolean;

    @Column({ 
        type: 'enum',
        enum: ['active', 'inactive', 'paused'],
        default: 'active'
    })
    @Index()
    status!: 'active' | 'inactive' | 'paused';

    @Column({ name: 'triggered_count', default: 0 })
    triggeredCount!: number;

    @Column({ name: 'last_triggered_at', type: 'datetime', nullable: true })
    lastTriggeredAt?: Date;

    @Column({ type: 'text', nullable: true })
    memo?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @ManyToOne(() => WalletUser, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: WalletUser;
}
