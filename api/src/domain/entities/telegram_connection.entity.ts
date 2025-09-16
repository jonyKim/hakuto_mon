import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToOne, JoinColumn } from 'typeorm';
import { WalletUser } from './wallet_user.entity';

@Entity('telegram_connections')
export class TelegramConnection {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'user_id' })
    @Index()
    userId!: string;

    @Column({ name: 'chat_id', length: 50 })
    @Index()
    chatId!: string;

    @Column({ length: 100, nullable: true })
    username?: string;

    @Column({ name: 'connection_code', length: 20, nullable: true })
    @Index()
    connectionCode?: string;

    @Column({ name: 'code_expires_at', type: 'datetime', nullable: true })
    codeExpiresAt?: Date;

    @Column({ name: 'is_active', default: true })
    @Index()
    isActive!: boolean;

    @Column({ name: 'connected_at', type: 'datetime' })
    connectedAt!: Date;

    @Column({ name: 'last_message_at', type: 'datetime', nullable: true })
    lastMessageAt?: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @OneToOne(() => WalletUser, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: WalletUser;
}
