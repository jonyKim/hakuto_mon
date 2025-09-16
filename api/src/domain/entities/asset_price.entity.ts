import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('asset_prices')
@Index(['symbol', 'exchange', 'createdAt'], { unique: true })
export class AssetPrice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 20 })
  symbol!: string;

  @Column({ name: 'price_usd', type: 'decimal', precision: 20, scale: 8 })
  priceUsd!: number;

  @Column({ name: 'price_change_24h', type: 'decimal', precision: 10, scale: 4, nullable: true })
  priceChange24h?: number;

  @Column({ name: 'volume_24h', type: 'decimal', precision: 20, scale: 2, nullable: true })
  volume24h?: number;

  @Column({ name: 'market_cap', type: 'decimal', precision: 20, scale: 2, nullable: true })
  marketCap?: number;

  @Column({ length: 50 })
  exchange!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // 추가 필드들 (MEXC API에서 제공하는 데이터)
  @Column({ name: 'price_change_percent_24h', type: 'decimal', precision: 10, scale: 4, nullable: true })
  priceChangePercent24h?: number;

  @Column({ name: 'high_24h', type: 'decimal', precision: 20, scale: 8, nullable: true })
  high24h?: number;

  @Column({ name: 'low_24h', type: 'decimal', precision: 20, scale: 8, nullable: true })
  low24h?: number;

  @Column({ name: 'open_price', type: 'decimal', precision: 20, scale: 8, nullable: true })
  openPrice?: number;

  @Column({ name: 'close_price', type: 'decimal', precision: 20, scale: 8, nullable: true })
  closePrice?: number;

  @Column({ name: 'weighted_avg_price', type: 'decimal', precision: 20, scale: 8, nullable: true })
  weightedAvgPrice?: number;

  @Column({ name: 'bid_price', type: 'decimal', precision: 20, scale: 8, nullable: true })
  bidPrice?: number;

  @Column({ name: 'ask_price', type: 'decimal', precision: 20, scale: 8, nullable: true })
  askPrice?: number;

  @Column({ name: 'last_updated_at', type: 'datetime', nullable: true })
  lastUpdatedAt?: Date;
}
