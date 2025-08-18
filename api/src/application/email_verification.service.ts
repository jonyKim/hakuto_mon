import { EmailService } from './email.service';
import { WalletUserRepository } from '../infrastructure/repositories/wallet_user.repository';
import { EmailVerificationAttemptRepository } from '../infrastructure/repositories/email_verification_attempt.repository';

export interface VerificationResult {
    success: boolean;
    message: string;
    data?: any;
}

export class EmailVerificationService {
    private emailService: EmailService;
    private walletUserRepository: WalletUserRepository;
    private emailVerificationRepository: EmailVerificationAttemptRepository;

    constructor(
        emailService: EmailService,
        walletUserRepository: WalletUserRepository,
        emailVerificationRepository: EmailVerificationAttemptRepository
    ) {
        this.emailService = emailService;
        this.walletUserRepository = walletUserRepository;
        this.emailVerificationRepository = emailVerificationRepository;
    }

    /**
     * 이메일 인증 코드 발송
     */
    async sendVerificationCode(
        userId: string,
        email: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<VerificationResult> {
        try {
            // 1. 사용자 존재 확인
            const user = await this.walletUserRepository.findById(userId);
            if (!user) {
                return {
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                };
            }

            // 2. 이메일 중복 확인 (다른 사용자가 이미 사용 중인지)
            if (user.email !== email) {
                const existingEmailUser = await this.walletUserRepository.findByEmail(email);
                if (existingEmailUser && existingEmailUser.emailVerified) {
                    return {
                        success: false,
                        message: '이미 다른 계정에서 사용 중인 이메일입니다.'
                    };
                }
            }

            // 3. 시간당 발송 제한 확인 (1시간에 5회)
            const recentAttempts = await this.emailVerificationRepository.getAttemptsByEmailInTimeRange(email, 1);
            if (recentAttempts.length >= 5) {
                return {
                    success: false,
                    message: '너무 많은 인증 요청이 있었습니다. 1시간 후 다시 시도해주세요.'
                };
            }

            // 4. 일일 발송 제한 확인 (24시간에 10회)
            const dailyAttempts = await this.emailVerificationRepository.getAttemptsByEmailInTimeRange(email, 24);
            if (dailyAttempts.length >= 10) {
                return {
                    success: false,
                    message: '일일 인증 요청 한도를 초과했습니다. 내일 다시 시도해주세요.'
                };
            }

            // 5. 인증 코드 생성
            const verificationCode = this.generateVerificationCode();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10분 후 만료

            // 6. 기존 미완료 인증 시도 무효화 (같은 사용자의 같은 이메일)
            const existingAttempt = await this.emailVerificationRepository.findByUserIdAndEmail(userId, email);
            if (existingAttempt) {
                await this.emailVerificationRepository.deleteByUserId(userId);
            }

            // 7. 새 인증 시도 기록 생성
            await this.emailVerificationRepository.create({
                userId,
                email,
                verificationCode,
                expiresAt,
                ipAddress,
                userAgent
            });

            // 8. 이메일 발송
            const emailSent = await this.emailService.sendVerificationCode(email, verificationCode, user.walletAddress);
            
            if (!emailSent) {
                return {
                    success: false,
                    message: '이메일 발송에 실패했습니다. 다시 시도해주세요.'
                };
            }

            return {
                success: true,
                message: '인증 코드가 이메일로 발송되었습니다.',
                data: {
                    email,
                    expiresAt: expiresAt.toISOString()
                }
            };

        } catch (error) {
            console.error('Error sending verification code:', error);
            return {
                success: false,
                message: '서버 오류가 발생했습니다. 나중에 다시 시도해주세요.'
            };
        }
    }

    /**
     * 인증 코드 검증
     */
    async verifyCode(verificationCode: string): Promise<VerificationResult> {
        try {
            // 1. 인증 시도 기록 조회
            const attempt = await this.emailVerificationRepository.findByVerificationCode(verificationCode);
            
            if (!attempt) {
                return {
                    success: false,
                    message: '유효하지 않거나 만료된 인증 코드입니다.'
                };
            }

            // 2. 최대 시도 횟수 확인 (5회)
            if (attempt.attemptsCount >= 5) {
                return {
                    success: false,
                    message: '최대 시도 횟수를 초과했습니다. 새로운 인증 코드를 요청해주세요.'
                };
            }

            // 3. 시도 횟수 증가
            await this.emailVerificationRepository.incrementAttempts(attempt.id);

            // 4. 만료 시간 확인
            if (new Date() > attempt.expiresAt) {
                return {
                    success: false,
                    message: '인증 코드가 만료되었습니다. 새로운 코드를 요청해주세요.'
                };
            }

            // 5. 인증 완료 처리
            await this.emailVerificationRepository.markAsVerified(attempt.id);

            // 6. 사용자 이메일 정보 업데이트
            await this.walletUserRepository.updateEmail(attempt.userId, attempt.email);
            await this.walletUserRepository.updateEmailVerification(attempt.userId, true);

            // 7. 인증 완료 이메일 발송
            const user = await this.walletUserRepository.findById(attempt.userId);
            if (user) {
                await this.emailService.sendVerificationSuccessEmail(attempt.email, user.walletAddress);
            }

            return {
                success: true,
                message: '이메일 인증이 완료되었습니다.',
                data: {
                    userId: attempt.userId,
                    email: attempt.email,
                    verifiedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('Error verifying code:', error);
            return {
                success: false,
                message: '서버 오류가 발생했습니다. 나중에 다시 시도해주세요.'
            };
        }
    }

    /**
     * 사용자의 인증 상태 조회
     */
    async getVerificationStatus(userId: string): Promise<VerificationResult> {
        try {
            const user = await this.walletUserRepository.findById(userId);
            
            if (!user) {
                return {
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                };
            }

            return {
                success: true,
                message: '인증 상태 조회 완료',
                data: {
                    userId: user.id,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    walletAddress: user.walletAddress
                }
            };

        } catch (error) {
            console.error('Error getting verification status:', error);
            return {
                success: false,
                message: '서버 오류가 발생했습니다.'
            };
        }
    }

    /**
     * 6자리 숫자 인증 코드 생성
     */
    private generateVerificationCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * 테스트용: 인증 코드 조회 (개발/테스트 환경에서만 사용)
     */
    async getTestVerificationCode(userId: string): Promise<VerificationResult> {
        try {
            // 개발/테스트 환경에서만 허용
            if (process.env.NODE_ENV === 'production') {
                return {
                    success: false,
                    message: '프로덕션 환경에서는 사용할 수 없습니다.'
                };
            }

            const attempt = await this.emailVerificationRepository.findByUserId(userId);
            
            if (!attempt) {
                return {
                    success: false,
                    message: '인증 시도 기록을 찾을 수 없습니다.'
                };
            }

            // 만료 시간 확인
            if (new Date() > attempt.expiresAt) {
                return {
                    success: false,
                    message: '인증 코드가 만료되었습니다.'
                };
            }

            return {
                success: true,
                message: '테스트용 인증 코드 조회 완료',
                data: {
                    userId: attempt.userId,
                    email: attempt.email,
                    verificationCode: attempt.verificationCode,
                    expiresAt: attempt.expiresAt.toISOString(),
                    attemptsCount: attempt.attemptsCount,
                    isVerified: attempt.isVerified
                }
            };

        } catch (error) {
            console.error('Error getting test verification code:', error);
            return {
                success: false,
                message: '서버 오류가 발생했습니다.'
            };
        }
    }

    /**
     * 만료된 인증 시도 정리 (크론잡에서 사용)
     */
    async cleanupExpiredAttempts(): Promise<void> {
        try {
            await this.emailVerificationRepository.deleteExpiredAttempts();
            console.log('Expired verification attempts cleaned up');
        } catch (error) {
            console.error('Error cleaning up expired attempts:', error);
        }
    }
} 