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

// Admin routers
app.use('/api/admin/auth', createAuthRouter(adminAuthController));
app.use('/api/admin/dashboard', createDashboardRouter(dashboardController));
app.use('/api/admin/nft-stats', createNFTStatsRouter(nftStatsController));
app.use('/api/admin/staking-stats', createStakingStatsRouter(stakingStatsController));
app.use('/api/admin/reward-stats', createRewardStatsRouter(rewardStatsController));
app.use('/api/admin/withdraw-stats', createWithdrawStatsRouter(withdrawStatsController));

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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
}); 