export class AppError extends Error {
    constructor(
        public code: string,
        message: string,
        public statusCode: number = 500,
        public details?: any
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: any) {
        super('VALIDATION_ERROR', message, 400, details);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = '인증이 필요합니다') {
        super('AUTHENTICATION_ERROR', message, 401);
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = '권한이 없습니다') {
        super('AUTHORIZATION_ERROR', message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = '리소스를 찾을 수 없습니다') {
        super('NOT_FOUND', message, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message: string, details?: any) {
        super('CONFLICT', message, 409, details);
    }
} 