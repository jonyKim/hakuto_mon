import { Router } from 'express';
import { 
    EmailVerificationController,
    sendVerificationCodeValidation,
    verifyCodeValidation
} from './email_verification.controller';

export function createEmailVerificationRouter(
    emailVerificationController: EmailVerificationController
): Router {
    const router = Router();

    // 이메일 인증 코드 발송
    router.post(
        '/send',
        sendVerificationCodeValidation,
        emailVerificationController.sendVerificationCode
    );

    // 인증 코드 검증
    router.post(
        '/verify',
        verifyCodeValidation,
        emailVerificationController.verifyCode
    );

    // 인증 상태 조회
    router.get(
        '/status/:user_id',
        emailVerificationController.getVerificationStatus
    );

    return router;
} 