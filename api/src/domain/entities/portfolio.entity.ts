import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToOne, JoinColumn } from 'typeorm';
import { WalletUser } from './wallet_user.entity';

export interface PortfolioAsset {
    symbol: string;
    name: string;
    balance: number;
    value: number;
    percentage: number;
    priceChange24h: number;
    priceChangePercentage24h: number;
}

export interface RiskMetrics {
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    correlation: { [key: string]: number };
    concentrationRisk: number;
}

@Entity('portfolios')
export class Portfolio {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'user_id' })
    @Index()
    userId!: string;

    @Column({ name: 'total_value', type: 'decimal', precision: 20, scale: 8, default: 0 })
    totalValue!: number;

    @Column({ name: 'total_value_change_24h', type: 'decimal', precision: 20, scale: 8, default: 0 })
    totalValueChange24h!: number;

    @Column({ name: 'profit_loss', type: 'decimal', precision: 20, scale: 8, default: 0 })
    profitLoss!: number;

    @Column({ name: 'profit_loss_percentage', type: 'decimal', precision: 10, scale: 4, default: 0 })
    profitLossPercentage!: number;

    @Column({ type: 'json' })
    assets!: PortfolioAsset[];

    @Column({ name: 'risk_metrics', type: 'json', nullable: true })
    riskMetrics?: RiskMetrics;

    @Column({ name: 'last_updated', type: 'datetime' })
    @Index()
    lastUpdated!: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @OneToOne(() => WalletUser, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: WalletUser;
}
