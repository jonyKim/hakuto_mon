import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    user?: {
        uuid_admin: string;
        email_id: string;
        admin_grade: string;
    };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;
        
        if (!token) {
            res.status(401).json({
                success: false,
                message: '인증 토큰이 필요합니다.'
            });
            return;
        }

        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, jwtSecret) as any;
        
        req.user = {
            uuid_admin: decoded.uuid_admin,
            email_id: decoded.email_id,
            admin_grade: decoded.admin_grade
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: '유효하지 않은 토큰입니다.'
        });
    }
};
