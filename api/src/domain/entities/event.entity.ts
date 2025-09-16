import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export interface EventLink {
    title: string;
    url: string;
    type: 'website' | 'twitter' | 'telegram' | 'discord' | 'medium' | 'other';
}

@Entity('events')
export class Event {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ 
        type: 'enum',
        enum: ['project_announcement', 'partnership', 'token_listing', 'staking_event', 'nft_drop', 'airdrop']
    })
    @Index()
    type!: 'project_announcement' | 'partnership' | 'token_listing' | 'staking_event' | 'nft_drop' | 'airdrop';

    @Column({ length: 255 })
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'longtext', nullable: true })
    content?: string;

    @Column({ 
        type: 'enum',
        enum: ['all_projects', 'hakuto_token', 'ecosystem', 'defi', 'nft']
    })
    @Index()
    scope!: 'all_projects' | 'hakuto_token' | 'ecosystem' | 'defi' | 'nft';

    @Column({ 
        type: 'enum',
        enum: ['upcoming', 'active', 'ended'],
        default: 'upcoming'
    })
    @Index()
    status!: 'upcoming' | 'active' | 'ended';

    @Column({ 
        type: 'enum',
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    })
    priority!: 'low' | 'medium' | 'high';

    @Column({ name: 'start_date', type: 'datetime', nullable: true })
    @Index()
    startDate?: Date;

    @Column({ name: 'end_date', type: 'datetime', nullable: true })
    endDate?: Date;

    @Column({ type: 'json', nullable: true })
    metadata?: any;

    @Column({ type: 'json', nullable: true })
    images?: string[];

    @Column({ type: 'json', nullable: true })
    links?: EventLink[];

    @Column({ type: 'json', nullable: true })
    tags?: string[];

    @Column({ name: 'view_count', default: 0 })
    viewCount!: number;

    @Column({ name: 'like_count', default: 0 })
    likeCount!: number;

    @Column({ name: 'created_by', length: 255 })
    @Index()
    createdBy!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
