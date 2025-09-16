import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { WalletUser } from './wallet_user.entity';

@Entity('portfolio_history')
export class PortfolioHistory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'user_id' })
    @Index()
    userId!: string;

    @Column({ name: 'total_value', type: 'decimal', precision: 20, scale: 8 })
    totalValue!: number;

    @Column({ name: 'profit_loss', type: 'decimal', precision: 20, scale: 8 })
    profitLoss!: number;

    @Column({ name: 'profit_loss_percentage', type: 'decimal', precision: 10, scale: 4 })
    profitLossPercentage!: number;

    @Column({ name: 'snapshot_date', type: 'date' })
    @Index()
    snapshotDate!: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    // Relations
    @ManyToOne(() => WalletUser, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: WalletUser;
}
