import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: '인증이 필요합니다.'
            });
            return;
        }

        // 어드민 권한 확인 (admin_grade가 'admin' 또는 'super_admin'인 경우)
        const allowedGrades = ['admin', 'super_admin'];
        if (!allowedGrades.includes(req.user.admin_grade)) {
            res.status(403).json({
                success: false,
                message: '어드민 권한이 필요합니다.'
            });
            return;
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({
            success: false,
            message: '권한 확인 중 오류가 발생했습니다.'
        });
    }
};
