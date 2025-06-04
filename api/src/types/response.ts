export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

export interface PaginatedResponse<T> extends ApiResponse {
    data: {
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface ApiError {
    code: string;
    message: string;
    details?: any;
} 