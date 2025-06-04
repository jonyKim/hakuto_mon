import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('admin_users')
export class AdminUser {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'uuid_admin', unique: true })
    uuidAdmin!: string;

    @Column({ name: 'name' })
    name!: string;

    @Column({ name: 'email_id', unique: true })
    emailId!: string;

    @Column({ name: 'admin_password' })
    adminPassword!: string;

    @Column({ name: 'admin_grade', default: 'user' })
    adminGrade!: string;

    @Column({ name: 'lastlogin_ip', nullable: true })
    lastloginIp!: string | null;

    @Column({ name: 'remember_token', nullable: true })
    rememberToken!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
} 