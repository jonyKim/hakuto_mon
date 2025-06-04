import { Request, Response, NextFunction, RequestHandler } from 'express';
import { JwtService } from '../application/jwt.service';
import { AuthenticationError, AuthorizationError } from '../domain/errors';
import { JwtPayload } from '../types/jwt';

export interface AuthenticatedRequest extends Request {
    user: JwtPayload;
}

export const createAuthMiddleware = (jwtService: JwtService): RequestHandler => {
    return (req: Request, _res: Response, next: NextFunction) => {
        // 쿠키에서 토큰 확인
        const cookieToken = req.cookies['auth-token'];
        
        // Authorization 헤더에서 Bearer 토큰 확인
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

        // 둘 중 하나의 토큰이라도 있으면 진행
        const token = cookieToken || bearerToken;

        if (!token) {
            next(new AuthenticationError('인증이 필요합니다'));
            return;
        }

        try {
            const decoded = jwtService.verifyToken(token);
            (req as AuthenticatedRequest).user = decoded;
            next();
        } catch (error) {
            next(new AuthenticationError('유효하지 않은 토큰입니다'));
        }
    };
};

export const createAdminMiddleware = (): RequestHandler => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const authenticatedReq = req as AuthenticatedRequest;
        if (!authenticatedReq.user || authenticatedReq.user.role !== 'admin') {
            next(new AuthorizationError('관리자 권한이 필요합니다'));
            return;
        }
        next();
    };
}; 