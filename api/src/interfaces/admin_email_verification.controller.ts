import { Request, Response } from 'express';
import { EmailVerificationService } from '../application/email_verification.service';
import { EmailVerificationAttemptRepository } from '../infrastructure/repositories/email_verification_attempt.repository';

export class AdminEmailVerificationController {
    private emailVerificationRepository: EmailVerificationAttemptRepository;

    constructor(
        _emailVerificationService: EmailVerificationService,
        emailVerificationRepository: EmailVerificationAttemptRepository
    ) {
        // emailVerificationService는 추후 확장 시 사용 예정
        this.emailVerificationRepository = emailVerificationRepository;
    }

    /**
     * 이메일 인증 통계 조회 (어드민용)
     */
    async getStats(_req: Request, res: Response): Promise<void> {
        try {
            // 전체 시도 수
            const totalAttempts = await this.emailVerificationRepository.getTotalAttempts();
            
            // 성공한 인증 수
            const successfulVerifications = await this.emailVerificationRepository.getSuccessfulVerifications();
            
            // 실패한 시도 수 (만료되거나 잘못된 코드)
            const failedAttempts = await this.emailVerificationRepository.getFailedAttempts();
            
            // 대기 중인 인증 수
            const pendingVerifications = await this.emailVerificationRepository.getPendingVerifications();
            
            // 오늘 시도 수
            const todayAttempts = await this.emailVerificationRepository.getTodayAttempts();
            
            // 성공률 계산
            const successRate = totalAttempts > 0 ? (successfulVerifications / totalAttempts) * 100 : 0;

            const stats = {
                totalAttempts,
                successfulVerifications,
                failedAttempts,
                pendingVerifications,
                todayAttempts,
                successRate: Math.round(successRate * 10) / 10 // 소수점 1자리
            };

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Failed to get email verification stats:', error);
            res.status(500).json({
                success: false,
                message: '통계 조회에 실패했습니다.'
            });
        }
    }

    /**
     * 최근 인증 시도 목록 조회 (어드민용)
     */
    async getRecentAttempts(req: Request, res: Response): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 50;
            const attempts = await this.emailVerificationRepository.getRecentAttempts(limit);

            res.json({
                success: true,
                data: attempts
            });
        } catch (error) {
            console.error('Failed to get recent attempts:', error);
            res.status(500).json({
                success: false,
                message: '최근 시도 목록 조회에 실패했습니다.'
            });
        }
    }

    /**
     * 특정 사용자의 인증 시도 이력 조회 (어드민용)
     */
    async getUserAttempts(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const attempts = await this.emailVerificationRepository.getUserAttempts(userId);

            res.json({
                success: true,
                data: attempts
            });
        } catch (error) {
            console.error('Failed to get user attempts:', error);
            res.status(500).json({
                success: false,
                message: '사용자 시도 이력 조회에 실패했습니다.'
            });
        }
    }

    /**
     * 만료된 인증 시도 정리 (어드민용)
     */
    async cleanupExpiredAttempts(_req: Request, res: Response): Promise<void> {
        try {
            await this.emailVerificationRepository.deleteExpiredAttempts();

            res.json({
                success: true,
                message: '만료된 인증 시도가 정리되었습니다.'
            });
        } catch (error) {
            console.error('Failed to cleanup expired attempts:', error);
            res.status(500).json({
                success: false,
                message: '정리 작업에 실패했습니다.'
            });
        }
    }
}
