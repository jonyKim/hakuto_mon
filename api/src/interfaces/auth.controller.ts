import { Response, RequestHandler } from 'express';
import { body, validationResult, ValidationError as ExpressValidationError } from 'express-validator';
import { AuthService } from '../application/auth.service';
import { ApiResponse, ValidationError } from '../types/response';
import { AppError } from '../domain/errors';

export class AuthController {
    constructor(private readonly authService: AuthService) {}

    static validations = {
        login: [
            body('email').isEmail().withMessage('유효한 이메일을 입력해주세요'),
            body('password').notEmpty().withMessage('비밀번호를 입력해주세요'),
        ],
    };

    private sendResponse<T>(res: Response, data: T): void {
        const response: ApiResponse<T> = {
            success: true,
            data
        };
        res.json(response);
    }

    private sendError(res: Response, error: AppError): void {
        const response: ApiResponse = {
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details
            }
        };
        res.status(error.statusCode).json(response);
    }

    login: RequestHandler = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const validationErrors: ValidationError[] = errors.array().map((err: ExpressValidationError) => ({
                    field: err.type === 'field' ? err.path : err.type,
                    message: err.msg
                }));
                const response: ApiResponse = {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: '입력값이 유효하지 않습니다',
                        details: validationErrors
                    }
                };
                res.status(400).json(response);
                return;
            }

            const { email, password } = req.body;
            const ip = req.ip || '';
            const userAgent = req.get('user-agent') || '';

            const result = await this.authService.login(email, password, ip, userAgent);

            res.cookie('auth-token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000, // 24시간
            });

            this.sendResponse(res, result);
        } catch (error) {
            if (error instanceof AppError) {
                this.sendError(res, error);
            } else {
                this.sendError(res, new AppError('INTERNAL_ERROR', '서버 오류가 발생했습니다'));
            }
        }
    };

    logout: RequestHandler = async (_req, res) => {
        res.clearCookie('auth-token');
        this.sendResponse(res, { message: '로그아웃되었습니다' });
    };

    checkSession: RequestHandler = async (req, res) => {
        try {
            const token = req.cookies['auth-token'];
            if (!token) {
                throw new AppError('AUTHENTICATION_ERROR', '인증이 필요합니다', 401);
            }

            if (!req.user?.id) {
                throw new AppError('AUTHENTICATION_ERROR', '유효하지 않은 토큰입니다', 401);
            }

            const result = await this.authService.refreshSession(Number(req.user.id));

            res.cookie('auth-token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000, // 24시간
            });

            this.sendResponse(res, result);
        } catch (error) {
            if (error instanceof AppError) {
                this.sendError(res, error);
            } else {
                this.sendError(res, new AppError('INTERNAL_ERROR', '서버 오류가 발생했습니다'));
            }
        }
    };

    testAuth: RequestHandler = async (req, res) => {
        try {
            const path = req.path;
            const user = req.user;

            if (!user) {
                throw new AppError('AUTHENTICATION_ERROR', '인증이 필요합니다', 401);
            }

            switch (path) {
                case '/test/token':
                    this.sendResponse(res, { user });
                    break;
                case '/test/role':
                    if (user.role !== 'admin') {
                        throw new AppError('AUTHORIZATION_ERROR', '관리자 권한이 필요합니다', 403);
                    }
                    this.sendResponse(res, { message: '관리자 권한 확인됨' });
                    break;
                case '/test/user':
                    const userInfo = await this.authService.findUserById(Number(user.id));
                    this.sendResponse(res, { user: userInfo });
                    break;
                default:
                    throw new AppError('NOT_FOUND', '잘못된 경로입니다', 404);
            }
        } catch (error) {
            if (error instanceof AppError) {
                this.sendError(res, error);
            } else {
                this.sendError(res, new AppError('INTERNAL_ERROR', '서버 오류가 발생했습니다'));
            }
        }
    };
} 