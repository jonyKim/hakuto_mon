import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('nfts')
export class NFT {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'contract_address' })
    contractAddress!: string;

    @Column({ name: 'token_id' })
    tokenId!: string;

    @Column({ name: 'owner_address' })
    ownerAddress!: string;

    @Column({ name: 'token_uri', nullable: true })
    tokenUri!: string | null;

    @Column({ name: 'metadata', type: 'json', nullable: true })
    metadata!: Record<string, any> | null;

    @Column({ name: 'is_staked', default: false })
    isStaked!: boolean;

    @Column({ name: 'staked_at', nullable: true })
    stakedAt!: Date | null;

    @Column({ name: 'unstaked_at', nullable: true })
    unstakedAt!: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
} 