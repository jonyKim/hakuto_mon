import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../types/user';
import { JwtPayload } from '../types/jwt';

export class JwtService {
    private readonly secret: string;
    private readonly expiresIn: string;

    constructor() {
        this.secret = process.env.JWT_SECRET || 'your-secret-key';
        this.expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    }

    generateToken(user: User): string {
        const payload: JwtPayload = {
            id: user.id,
            userId: user.id,
            email: user.email,
            role: user.role,
            wallet_address: user.wallet_address
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