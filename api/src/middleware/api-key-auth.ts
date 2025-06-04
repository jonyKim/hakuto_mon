import { Request, Response, NextFunction } from 'express';

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.MOBILE_API_KEY;

    if (!apiKey || apiKey !== validApiKey) {
        res.status(401).json({
            success: false,
            error: 'Invalid API key'
        });
        return;
    }

    next();
}; 