import { WalletUserRepository } from '../infrastructure/repositories/wallet_user.repository';
import { WalletUser } from '../domain/entities/wallet_user.entity';

export interface WalletUserStats {
    totalUsers: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    todayRegistrations: number;
}

export interface UserSearchFilters {
    emailVerified?: boolean;
    hasFcmToken?: boolean;
    registeredAfter?: Date;
    registeredBefore?: Date;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export class WalletUserService {
    private walletUserRepository: WalletUserRepository;

    constructor(walletUserRepository: WalletUserRepository) {
        this.walletUserRepository = walletUserRepository;
    }

    /**
     * 새 지갑 사용자 생성
     */
    async createUser(data: {
        walletAddress: string;
        email?: string;
        fcmToken?: string;
    }): Promise<WalletUser> {
        // 지갑 주소 중복 확인
        const existingWallet = await this.walletUserRepository.findByWalletAddress(data.walletAddress);
        if (existingWallet) {
            throw new Error('이미 등록된 지갑 주소입니다.');
        }

        // 이메일 중복 확인
        if (data.email) {
            const existingEmail = await this.walletUserRepository.findByEmail(data.email);
            if (existingEmail) {
                throw new Error('이미 등록된 이메일 주소입니다.');
            }
        }

        return await this.walletUserRepository.create({
            walletAddress: data.walletAddress,
            email: data.email,
            fcmToken: data.fcmToken,
            emailVerified: false
        });
    }

    /**
     * 사용자 조회 (ID)
     */
    async getUserById(id: string): Promise<WalletUser | null> {
        return await this.walletUserRepository.findById(id);
    }

    /**
     * 사용자 조회 (지갑 주소)
     */
    async getUserByWalletAddress(walletAddress: string): Promise<WalletUser | null> {
        return await this.walletUserRepository.findByWalletAddress(walletAddress);
    }

    /**
     * 사용자 조회 (이메일)
     */
    async getUserByEmail(email: string): Promise<WalletUser | null> {
        return await this.walletUserRepository.findByEmail(email);
    }

    /**
     * 사용자 정보 업데이트
     */
    async updateUser(id: string, data: {
        email?: string;
        fcmToken?: string;
        emailVerified?: boolean;
    }): Promise<WalletUser | null> {
        const existingUser = await this.walletUserRepository.findById(id);
        if (!existingUser) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }

        // 이메일 변경 시 중복 확인
        if (data.email && data.email !== existingUser.email) {
            const emailUser = await this.walletUserRepository.findByEmail(data.email);
            if (emailUser && emailUser.id !== id) {
                throw new Error('이미 사용 중인 이메일 주소입니다.');
            }
        }

        return await this.walletUserRepository.update(id, data);
    }

    /**
     * 이메일 업데이트
     */
    async updateEmail(id: string, email: string): Promise<WalletUser | null> {
        return await this.walletUserRepository.updateEmail(id, email);
    }

    /**
     * FCM 토큰 업데이트
     */
    async updateFcmToken(id: string, fcmToken: string): Promise<WalletUser | null> {
        return await this.walletUserRepository.updateFcmToken(id, fcmToken);
    }

    /**
     * 이메일 인증 상태 업데이트
     */
    async updateEmailVerification(id: string, verified: boolean): Promise<WalletUser | null> {
        return await this.walletUserRepository.updateEmailVerification(id, verified);
    }

    /**
     * 사용자 삭제
     */
    async deleteUser(id: string): Promise<void> {
        const existingUser = await this.walletUserRepository.findById(id);
        if (!existingUser) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }

        await this.walletUserRepository.delete(id);
    }

    /**
     * 사용자 목록 조회 (페이지네이션)
     */
    async getUsers(page: number = 1, limit: number = 10): Promise<PaginatedResult<WalletUser>> {
        const offset = (page - 1) * limit;
        const users = await this.walletUserRepository.findAll(limit, offset);
        const total = await this.walletUserRepository.count();

        return {
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * 사용자 통계 조회
     */
    async getUserStats(): Promise<WalletUserStats> {
        const totalUsers = await this.walletUserRepository.count();
        const verifiedUsers = await this.walletUserRepository.getVerifiedUsersCount();
        const unverifiedUsers = await this.walletUserRepository.getUnverifiedUsersCount();
        const todayRegistrations = await this.walletUserRepository.getTodayRegistrationsCount();
        
        return {
            totalUsers,
            verifiedUsers,
            unverifiedUsers,
            todayRegistrations
        };
    }

    /**
     * 활성 사용자 확인 (FCM 토큰 또는 이메일 인증된 사용자)
     */
    async isActiveUser(id: string): Promise<boolean> {
        const user = await this.getUserById(id);
        if (!user) {
            return false;
        }

        return !!(user.fcmToken || (user.email && user.emailVerified));
    }

    /**
     * 알림 수신 가능한 사용자들 조회
     */
    async getNotifiableUsers(limit?: number, offset?: number): Promise<WalletUser[]> {
        // FCM 토큰이 있거나 이메일 인증된 사용자들
        // 실제 구현시 Repository에서 조건부 조회 메서드 필요
        const allUsers = await this.walletUserRepository.findAll(limit, offset);
        
        return allUsers.filter(user => 
            user.fcmToken || (user.email && user.emailVerified)
        );
    }

    /**
     * 사용자 데이터 검증
     */
    validateWalletAddress(address: string): boolean {
        const walletRegex = /^0x[a-fA-F0-9]{40}$/;
        return walletRegex.test(address);
    }

    /**
     * 이메일 형식 검증
     */
    validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 사용자 프로필 요약 생성
     */
    async getUserProfile(id: string): Promise<{
        user: WalletUser;
        status: {
            canReceiveNotifications: boolean;
            isEmailVerified: boolean;
            hasFcmToken: boolean;
        };
    } | null> {
        const user = await this.getUserById(id);
        if (!user) {
            return null;
        }

        return {
            user,
            status: {
                canReceiveNotifications: !!(user.fcmToken || (user.email && user.emailVerified)),
                isEmailVerified: user.emailVerified,
                hasFcmToken: !!user.fcmToken
            }
        };
    }

    /**
     * 벌크 사용자 정보 업데이트 (관리자용)
     */
    async bulkUpdateUsers(userIds: string[], data: {
        emailVerified?: boolean;
        fcmToken?: string;
    }): Promise<{ updated: number; failed: string[] }> {
        let updated = 0;
        const failed: string[] = [];

        for (const id of userIds) {
            try {
                await this.updateUser(id, data);
                updated++;
            } catch (error) {
                failed.push(id);
                console.error(`Failed to update user ${id}:`, error);
            }
        }

        return { updated, failed };
    }
} 