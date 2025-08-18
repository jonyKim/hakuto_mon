import { Request, Response } from 'express';
import { EmailVerificationService } from '../application/email_verification.service';
import { body, validationResult } from 'express-validator';

export class EmailVerificationController {
    private emailVerificationService: EmailVerificationService;

    constructor(emailVerificationService: EmailVerificationService) {
        this.emailVerificationService = emailVerificationService;
    }

    /**
     * 이메일 인증 코드 발송
     * POST /api/email-verification/send
     */
    sendVerificationCode = async (req: Request, res: Response): Promise<void> => {
        try {
            // Validation 에러 확인
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '입력값이 올바르지 않습니다.',
                    errors: errors.array()
                });
                return;
            }

            const { user_id, email } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');

            const result = await this.emailVerificationService.sendVerificationCode(
                user_id,
                email,
                ipAddress,
                userAgent
            );

            const statusCode = result.success ? 200 : 400;
            res.status(statusCode).json(result);

        } catch (error) {
            console.error('Error in sendVerificationCode:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 인증 코드 검증
     * POST /api/email-verification/verify
     */
    verifyCode = async (req: Request, res: Response): Promise<void> => {
        try {
            // Validation 에러 확인
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '입력값이 올바르지 않습니다.',
                    errors: errors.array()
                });
                return;
            }

            const { verification_code } = req.body;

            const result = await this.emailVerificationService.verifyCode(verification_code);

            const statusCode = result.success ? 200 : 400;
            res.status(statusCode).json(result);

        } catch (error) {
            console.error('Error in verifyCode:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 인증 상태 조회
     * GET /api/email-verification/status/:user_id
     */
    getVerificationStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const { user_id } = req.params;

            if (!user_id) {
                res.status(400).json({
                    success: false,
                    message: 'user_id가 필요합니다.'
                });
                return;
            }

            const result = await this.emailVerificationService.getVerificationStatus(user_id);

            const statusCode = result.success ? 200 : 404;
            res.status(statusCode).json(result);

        } catch (error) {
            console.error('Error in getVerificationStatus:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 테스트용: 인증 코드 조회 (개발/테스트 환경에서만 사용)
     * GET /api/email-verification/test/code/:user_id
     */
    getTestVerificationCode = async (req: Request, res: Response): Promise<void> => {
        try {
            // 개발/테스트 환경에서만 허용
            if (process.env.NODE_ENV === 'production') {
                res.status(403).json({
                    success: false,
                    message: '프로덕션 환경에서는 사용할 수 없습니다.'
                });
                return;
            }

            const { user_id } = req.params;

            if (!user_id) {
                res.status(400).json({
                    success: false,
                    message: 'user_id가 필요합니다.'
                });
                return;
            }

            const result = await this.emailVerificationService.getTestVerificationCode(user_id);

            const statusCode = result.success ? 200 : 404;
            res.status(statusCode).json(result);

        } catch (error) {
            console.error('Error in getTestVerificationCode:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    };
}

/**
 * 이메일 인증 코드 발송 유효성 검사 미들웨어
 */
export const sendVerificationCodeValidation = [
    body('user_id')
        .notEmpty()
        .withMessage('user_id는 필수입니다.')
        .isUUID()
        .withMessage('user_id는 유효한 UUID여야 합니다.'),
    body('email')
        .notEmpty()
        .withMessage('email은 필수입니다.')
        .isEmail()
        .withMessage('유효한 이메일 주소를 입력해주세요.')
        .normalizeEmail()
];

/**
 * 인증 코드 검증 유효성 검사 미들웨어
 */
export const verifyCodeValidation = [
    body('verification_code')
        .notEmpty()
        .withMessage('verification_code는 필수입니다.')
        .isLength({ min: 6, max: 6 })
        .withMessage('인증 코드는 6자리여야 합니다.')
        .isNumeric()
        .withMessage('인증 코드는 숫자만 입력 가능합니다.')
]; 