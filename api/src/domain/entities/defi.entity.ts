import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { NFT } from './nft.entity';

@Entity('defi_stakes')
export class DeFiStake {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'nft_id' })
    nftId!: string;

    @ManyToOne(() => NFT)
    @JoinColumn({ name: 'nft_id' })
    nft!: NFT;

    @Column({ name: 'contract_address' })
    contractAddress!: string;

    @Column({ name: 'staker_address' })
    stakerAddress!: string;

    @Column({ name: 'amount', type: 'decimal', precision: 65, scale: 0 })
    amount!: string;

    @Column({ name: 'reward_rate', type: 'decimal', precision: 10, scale: 4 })
    rewardRate!: string;

    @Column({ name: 'total_rewards', type: 'decimal', precision: 65, scale: 0, default: '0' })
    totalRewards!: string;

    @Column({ name: 'last_reward_at', nullable: true })
    lastRewardAt!: Date | null;

    @Column({ name: 'is_active', default: true })
    isActive!: boolean;

    @Column({ name: 'unstaked_at', nullable: true })
    unstakedAt!: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}

@Entity('defi_rewards')
export class DeFiReward {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'stake_id' })
    stakeId!: string;

    @ManyToOne(() => DeFiStake)
    @JoinColumn({ name: 'stake_id' })
    stake!: DeFiStake;

    @Column({ name: 'amount', type: 'decimal', precision: 65, scale: 0 })
    amount!: string;

    @Column({ name: 'reward_date' })
    rewardDate!: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
} 