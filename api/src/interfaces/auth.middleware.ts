import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    id: string;
    userId: string;
    email: string;
    role: string;
}

interface AdminJwtPayload {
    uuid_admin: string;
    email_id: string;
    admin_grade: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
            admin?: AdminJwtPayload;
            file?: {
                fieldname: string;
                originalname: string;
                encoding: string;
                mimetype: string;
                buffer: Buffer;
                size: number;
            };
        }
    }
}

export const authenticateJwt: RequestHandler = (req, res, next) => {
    const token = req.cookies['auth-token'];

    if (!token) {
        console.log('token', token);
        res.status(401).json({ message: '인증이 필요합니다' });
        return;
    }

    try {
        console.log('token', token);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        req.user = decoded;
        console.log('decoded', decoded);
        next();
    } catch (error) {
        console.log('error', error);
        res.status(401).json({ message: '유효하지 않은 토큰입니다' });
        return;
    }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        console.log('req.user', req.user);
        res.status(403).json({ message: '관리자 권한이 필요합니다' });
        return;
    }
    next();
};

/**
 * 어드민 JWT 인증 미들웨어 (쿠키 또는 Authorization 헤더 지원)
 */
export const authenticateAdmin: RequestHandler = (req, res, next) => {
    // 쿠키에서 토큰 확인 (기존 방식)
    let token = req.cookies['auth-token'];
    
    // Authorization 헤더에서 토큰 확인 (새로운 방식)
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }

    if (!token) {
        console.log('Admin token not found');
        res.status(401).json({ 
            success: false, 
            message: '인증 토큰이 필요합니다.' 
        });
        return;
    }

    try {
        const jwtSecret = process.env.JWT_SECRET!;
        const decoded = jwt.verify(token, jwtSecret) as any;
        
        // 기존 형식 (role 기반) 또는 새 형식 (admin_grade 기반) 지원
        if (decoded.role === 'admin' || decoded.admin_grade) {
            req.admin = {
                uuid_admin: decoded.uuid_admin || decoded.id,
                email_id: decoded.email_id || decoded.email,
                admin_grade: decoded.admin_grade || decoded.role
            };
            next();
        } else {
            res.status(403).json({ 
                success: false, 
                message: '어드민 권한이 필요합니다.' 
            });
        }
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(401).json({ 
            success: false, 
            message: '유효하지 않은 토큰입니다.' 
        });
    }
};

/**
 * 어드민 권한 확인 미들웨어
 */
export const requireAdminGrade: RequestHandler = (req, res, next) => {
    if (!req.admin) {
        res.status(401).json({
            success: false,
            message: '인증이 필요합니다.'
        });
        return;
    }

    // 어드민 권한 확인 (admin_grade가 'admin' 또는 'super_admin'인 경우)
    const allowedGrades = ['admin', 'super_admin'];
    if (!allowedGrades.includes(req.admin.admin_grade)) {
        res.status(403).json({
            success: false,
            message: '어드민 권한이 필요합니다.'
        });
        return;
    }

    next();
};

/**
 * 모바일 API 키 인증 미들웨어
 */
export const authenticateApiKey: RequestHandler = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
        res.status(401).json({
            success: false,
            message: 'API 키가 필요합니다.'
        });
        return;
    }

    // API 키 검증 로직 (환경변수 또는 데이터베이스에서)
    const validApiKeys = process.env.MOBILE_API_KEYS?.split(',') || [];
    
    if (!validApiKeys.includes(apiKey)) {
        res.status(401).json({
            success: false,
            message: '유효하지 않은 API 키입니다.'
        });
        return;
    }

    next();
}; 