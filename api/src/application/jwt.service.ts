import jwt, { SignOptions } from 'jsonwebtoken';
import { AdminUser } from '../types/user';
import { JwtPayload } from '../types/jwt';

export class JwtService {
    private readonly secret: string;
    private readonly expiresIn: string;

    constructor() {
        this.secret = process.env.JWT_SECRET || 'your-secret-key';
        this.expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    }

    generateToken(user: AdminUser): string {
        const payload: JwtPayload = {
            id: user.id.toString(),
            userId: user.id.toString(),
            email: user.emailId,
            role: user.adminGrade,
        };

        return jwt.sign(
            payload,
            this.secret,
            { expiresIn: this.expiresIn } as SignOptions
        );
    }

    verifyToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, this.secret) as JwtPayload;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    decodeToken(token: string): JwtPayload {
        return jwt.decode(token) as JwtPayload;
    }
} 