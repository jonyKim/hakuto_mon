import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    id: string;
    userId: string;
    email: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
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