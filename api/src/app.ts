import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

import { AuthService } from './application/auth.service';
import { AuthController } from './interfaces/auth.controller';
import { createAuthRouter } from './interfaces/auth.routes';

// Dashboard related imports
import createDashboardRouter from './interfaces/dashboard.routes';
import { createNFTStatsRouter } from './interfaces/nft.stats.routes';

import { DashboardController } from './interfaces/dashboard.controller';
import { DashboardService } from './application/dashboard.service';
import { DashboardRepository } from './infrastructure/dashboard.repository';

import { AdminAuthRepository } from './infrastructure/auth.repository';
import { NFTStatsRepository } from './infrastructure/nft.stats.repository';
import { NFTStatsService } from './application/nft.stats.service';
import { NFTStatsController } from './interfaces/nft.stats.controller';

import { createStakingStatsRouter } from './interfaces/staking.stats.routes';
import { StakingStatsController } from './interfaces/staking.stats.controller';
import { StakingStatsService } from './application/staking.stats.service';
import { StakingStatsRepository } from './infrastructure/staking.stats.repository';

import { createRewardStatsRouter } from './interfaces/reward.stats.routes';
import { RewardStatsController } from './interfaces/reward.stats.controller';
import { RewardStatsService } from './application/reward.stats.service';
import { RewardStatsRepository } from './infrastructure/reward.stats.repository';

import { createWithdrawStatsRouter } from './interfaces/withdraw.stats.routes';
import { WithdrawStatsController } from './interfaces/withdraw.stats.controller';
import { WithdrawStatsService } from './application/withdraw.stats.service';
import { WithdrawStatsRepository } from './infrastructure/withdraw.stats.repository';

// Wallet User imports
import walletUserRoutes from './interfaces/wallet_user.routes';

// Email Verification imports
import { createEmailVerificationRouter } from './interfaces/email_verification.routes';
import { EmailVerificationController } from './interfaces/email_verification.controller';
import { createAdminWalletUserRouter } from './interfaces/admin_wallet_user.routes';
import { AdminWalletUserController } from './interfaces/admin_wallet_user.controller';
import { createAdminEmailVerificationRouter } from './interfaces/admin_email_verification.routes';
import { AdminEmailVerificationController } from './interfaces/admin_email_verification.controller';
import { EmailVerificationService } from './application/email_verification.service';
import { EmailService } from './application/email.service';
import { EmailVerificationAttemptRepository } from './infrastructure/repositories/email_verification_attempt.repository';
import { WalletUserRepository } from './infrastructure/repositories/wallet_user.repository';

// Firebase and Notification imports
import { FirebaseService } from './application/firebase.service';
import { NotificationService } from './application/notification.service';
import { NotificationLogRepository } from './infrastructure/repositories/notification_log.repository';

// Alert System imports
import { AlertService } from './application/alert.service';
import { EventService } from './application/event.service';
import { PortfolioService } from './application/portfolio.service';
import { TelegramService } from './application/telegram.service';
import { AlertRuleRepository } from './infrastructure/repositories/alert_rule.repository';
import { EventRepository } from './infrastructure/repositories/event.repository';
import { PortfolioRepository } from './infrastructure/repositories/portfolio.repository';
import { PortfolioHistoryRepository } from './infrastructure/repositories/portfolio_history.repository';
import { TelegramConnectionRepository } from './infrastructure/repositories/telegram_connection.repository';
import { NotificationHistoryRepository } from './infrastructure/repositories/notification_history.repository';

// Alert System routes
import alertRoutes from './interfaces/alert.routes';
import eventRoutes from './interfaces/event.routes';
import portfolioRoutes from './interfaces/portfolio.routes';
import telegramRoutes from './interfaces/telegram.routes';

// Scheduler imports
import { SchedulerManager } from './infrastructure/schedulers/scheduler_manager';
import { schedulerManager as priceSchedulerManager } from './infrastructure/schedulers/scheduler.manager';

// Price System imports
import priceRoutes from './interfaces/price.routes';

dotenv.config();

const app = express();

// Middleware setup
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
app.use(express.json());
app.use(cookieParser());

// Static file serving
app.use('/favicon.ico', express.static(path.join(__dirname, '../public/favicon.ico')));
app.use('/static', express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Dependency injection
const adminAuthRepository = new AdminAuthRepository();
const adminAuthService = new AuthService(adminAuthRepository);
const adminAuthController = new AuthController(adminAuthService);

// Dashboard dependencies
const dashboardRepository = new DashboardRepository();
const dashboardService = new DashboardService(dashboardRepository);
const dashboardController = new DashboardController(dashboardService);

// NFT Stats dependencies
const nftStatsRepository = new NFTStatsRepository();
const nftStatsService = new NFTStatsService(nftStatsRepository);
const nftStatsController = new NFTStatsController(nftStatsService);

// Staking Stats dependencies
const stakingStatsRepository = new StakingStatsRepository();
const stakingStatsService = new StakingStatsService(stakingStatsRepository);
const stakingStatsController = new StakingStatsController(stakingStatsService);

// Reward Stats dependencies
const rewardStatsRepository = new RewardStatsRepository();
const rewardStatsService = new RewardStatsService(rewardStatsRepository);
const rewardStatsController = new RewardStatsController(rewardStatsService);

// Withdraw Stats dependencies
const withdrawStatsRepository = new WithdrawStatsRepository();
const withdrawStatsService = new WithdrawStatsService(withdrawStatsRepository);
const withdrawStatsController = new WithdrawStatsController(withdrawStatsService);

// Email Verification dependencies
const walletUserRepository = new WalletUserRepository();
const emailVerificationAttemptRepository = new EmailVerificationAttemptRepository();
const emailService = new EmailService({
    host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
    secure: process.env.EMAIL_SMTP_SECURE === 'true',
    user: process.env.EMAIL_SMTP_USER || '',
    password: process.env.EMAIL_SMTP_PASSWORD || '',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@hakuto.io',
    fromName: process.env.EMAIL_FROM_NAME || 'HAKUTO MON'
});
const emailVerificationService = new EmailVerificationService(
    emailService,
    walletUserRepository,
    emailVerificationAttemptRepository
);
const emailVerificationController = new EmailVerificationController(emailVerificationService);

// Admin Wallet User dependencies
const adminWalletUserController = new AdminWalletUserController();

// Admin Email Verification dependencies
const adminEmailVerificationController = new AdminEmailVerificationController(
    emailVerificationService,
    emailVerificationAttemptRepository
);

// Firebase and Notification dependencies
const firebaseService = new FirebaseService({
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || ''
});

// Firebase 초기화 (환경 변수가 설정된 경우에만)
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
        firebaseService.initialize();
        console.log('Firebase service initialized successfully');
    } catch (error) {
        console.warn('Firebase initialization failed:', error);
    }
} else {
    console.warn('Firebase credentials not provided. FCM notifications will not work.');
}

const notificationLogRepository = new NotificationLogRepository();
const notificationService = new NotificationService(
    firebaseService,
    emailService,
    notificationLogRepository,
    walletUserRepository
);

// Alert System dependencies
const alertRuleRepository = new AlertRuleRepository();
const eventRepository = new EventRepository();
const portfolioRepository = new PortfolioRepository();
const portfolioHistoryRepository = new PortfolioHistoryRepository();
const telegramConnectionRepository = new TelegramConnectionRepository();
const notificationHistoryRepository = new NotificationHistoryRepository();

const telegramService = new TelegramService(
    telegramConnectionRepository,
    walletUserRepository
);

const portfolioService = new PortfolioService(
    portfolioRepository,
    portfolioHistoryRepository,
    walletUserRepository
);

const eventService = new EventService(
    eventRepository,
    alertRuleRepository,
    notificationService
);

const alertService = new AlertService(
    alertRuleRepository,
    notificationHistoryRepository,
    portfolioRepository,
    eventRepository,
    telegramConnectionRepository,
    walletUserRepository,
    notificationService,
    telegramService
);

// Scheduler Manager 초기화
const schedulerManager = new SchedulerManager(
    alertService,
    portfolioService,
    eventService,
    telegramService,
    notificationService
);

console.log('Alert System initialized successfully');

// Admin routers
app.use('/api/admin/auth', createAuthRouter(adminAuthController));
app.use('/api/admin/dashboard', createDashboardRouter(dashboardController));
app.use('/api/admin/nft-stats', createNFTStatsRouter(nftStatsController));
app.use('/api/admin/staking-stats', createStakingStatsRouter(stakingStatsController));
app.use('/api/admin/reward-stats', createRewardStatsRouter(rewardStatsController));
app.use('/api/admin/withdraw-stats', createWithdrawStatsRouter(withdrawStatsController));
app.use('/api/admin/wallet-users', createAdminWalletUserRouter(adminWalletUserController));
app.use('/api/admin/email-verification', createAdminEmailVerificationRouter(adminEmailVerificationController));

// Public API routes
app.use('/api/wallet-users', walletUserRoutes);
app.use('/api/email-verification', createEmailVerificationRouter(emailVerificationController));

// Alert System API routes
app.use('/api/alerts', alertRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/telegram', telegramRoutes);

// Price System API routes
app.use('/api/price', priceRoutes);

// Scheduler management endpoints (Admin only)
app.get('/api/admin/scheduler/status', (_req, res) => {
    try {
        const status = schedulerManager.getStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, message: '스케줄러 상태 조회 실패' });
    }
});

app.get('/api/admin/scheduler/health', async (_req, res) => {
    try {
        const health = await schedulerManager.healthCheck();
        res.json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, message: '헬스 체크 실패' });
    }
});

app.post('/api/admin/scheduler/trigger', async (_req, res) => {
    try {
        const results = await schedulerManager.triggerManualTasks();
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: '수동 작업 실행 실패' });
    }
});

app.post('/api/admin/scheduler/restart', async (_req, res) => {
    try {
        await schedulerManager.restart();
        res.json({ success: true, message: '스케줄러가 재시작되었습니다.' });
    } catch (error) {
        res.status(500).json({ success: false, message: '스케줄러 재시작 실패' });
    }
});

// Request logging middleware
app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`, {
        body: req.body,
        cookies: req.cookies,
    });
    next();
});

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
});

const PORT = Number(process.env.PORT) || 3001;

// 서버 시작 및 스케줄러 초기화
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
    
    // 스케줄러 시작
    try {
        await schedulerManager.startAll();
        console.log('✅ 알림 시스템 스케줄러가 시작되었습니다');
        
        // HKTM 가격 수집 스케줄러 시작
        await priceSchedulerManager.startAll();
        console.log('✅ HKTM 가격 수집 스케줄러가 시작되었습니다');
    } catch (error) {
        console.error('❌ 스케줄러 시작 실패:', error);
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
    try {
        await schedulerManager.stopAll();
        priceSchedulerManager.stopAll();
        console.log('✅ 모든 스케줄러가 정상적으로 종료되었습니다');
        process.exit(0);
    } catch (error) {
        console.error('❌ 스케줄러 종료 중 오류:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT 신호를 받았습니다. 서버를 종료합니다...');
    try {
        await schedulerManager.stopAll();
        priceSchedulerManager.stopAll();
        console.log('✅ 모든 스케줄러가 정상적으로 종료되었습니다');
        process.exit(0);
    } catch (error) {
        console.error('❌ 스케줄러 종료 중 오류:', error);
        process.exit(1);
    }
}); 