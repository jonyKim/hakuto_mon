import { Router, RequestHandler } from 'express';
import { AuthController } from './auth.controller';
import { authenticateJwt } from './auth.middleware';

export const createAuthRouter = (authController: AuthController) => {
    const router = Router();

    const loginHandler: RequestHandler = (req, res, next) => authController.login(req, res, next);
    const logoutHandler: RequestHandler = (req, res, next) => authController.logout(req, res, next);
    const sessionHandler: RequestHandler = (req, res, next) => authController.checkSession(req, res, next);
    const testHandler: RequestHandler = (req, res, next) => authController.testAuth(req, res, next);

    router.post('/login', AuthController.validations.login, loginHandler);
    router.post('/logout', authenticateJwt, logoutHandler);
    router.get('/session', authenticateJwt, sessionHandler);

    router.get('/test/token', authenticateJwt, testHandler);
    router.get('/test/role', authenticateJwt, testHandler);
    router.get('/test/user', authenticateJwt, testHandler);

    return router;
}; 