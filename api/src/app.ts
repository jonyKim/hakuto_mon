import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

import { AuthService } from './application/auth.service';
import { AuthController } from './interfaces/auth.controller';
import { createAuthRouter } from './interfaces/auth.routes';

// LFIT 관련 라우터 임포트
import { createMissionRewardsRouter } from './interfaces/mission.rewards.routes';
import { createAdRewardsRouter } from './interfaces/ad.rewards.routes';
import { createMissionClaimRouter } from './interfaces/mission.claims.routes';
import { createAdClaimRouter } from './interfaces/ad.claims.routes';
import createDashboardRouter from './interfaces/dashboard.routes';
import usersRouter from './interfaces/users.routes';

import { MissionRewardsService } from './application/mission.rewards.service';
import { AdRewardsService } from './application/ad.rewards.service';
import { MissionClaimsService } from './application/mission.claims.service';
import { AdClaimsService } from './application/ad.claims.service';

import { MissionRewardRepository } from './infrastructure/mission.rewards.repository';
import { AdRewardRepository } from './infrastructure/ad.rewards.repository';
import { MissionClaimsRepository } from './infrastructure/mission.claims.repository';
import { AdClaimRepository } from './infrastructure/ad.claims.repository';

import { MissionRewardsController } from './interfaces/mission.rewards.controller';
import { AdRewardsController } from './interfaces/ad.rewards.controller';
import { MissionClaimController } from './interfaces/mission.claims.controller';
import { AdClaimController } from './interfaces/ad.claims.controller';

// Mobile API imports
import { createMobileApiRouter } from './interfaces/mobile/routes';
import { MobileApiController } from './interfaces/mobile/controller';
import { MobileApiService } from './application/mobile.service';
import { apiKeyAuth } from './middleware/api-key-auth';

import { DashboardController } from './interfaces/dashboard.controller';
import { DashboardService } from './application/dashboard.service';
import { DashboardRepository } from './infrastructure/dashboard.repository';

import { AdminAuthRepository } from './infrastructure/auth.repository';

dotenv.config();

const app = express();

// 미들웨어 설정
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'app://lfit'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
app.use(express.json());
app.use(cookieParser());

// 정적 파일 서빙 설정
app.use('/favicon.ico', express.static(path.join(__dirname, '../public/favicon.ico')));
app.use('/static', express.static(path.join(__dirname, '../public')));

// 헬스 체크 엔드포인트
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

// 의존성 주입 (AdminUser 기반)
const adminAuthRepository = new AdminAuthRepository();
const adminAuthService = new AuthService(adminAuthRepository);
const adminAuthController = new AuthController(adminAuthService);

// 미션 보상 관련 의존성
const missionRewardRepository = new MissionRewardRepository();
const missionRewardService = new MissionRewardsService(missionRewardRepository);
const missionRewardController = new MissionRewardsController(missionRewardService);

// 광고 보상 관련 의존성
const adRewardRepository = new AdRewardRepository();
const adRewardService = new AdRewardsService(adRewardRepository);
const adRewardController = new AdRewardsController(adRewardService);

// 미션 클레임 관련 의존성
const missionClaimsRepository = new MissionClaimsRepository();
const missionClaimsService = new MissionClaimsService(missionClaimsRepository);
const missionClaimsController = new MissionClaimController(missionClaimsService);

// 광고 클레임 관련 의존성
const adClaimRepository = new AdClaimRepository();
const adClaimService = new AdClaimsService(adClaimRepository);
const adClaimController = new AdClaimController(adClaimService);

// Mobile API 의존성
const mobileApiService = new MobileApiService(missionRewardRepository, missionClaimsRepository);
const mobileApiController = new MobileApiController(mobileApiService);

// Admin 라우터 설정
app.use('/api/admin/auth', createAuthRouter(adminAuthController));
app.use('/api/admin/mission-rewards', createMissionRewardsRouter(missionRewardController));
app.use('/api/admin/ad-rewards', createAdRewardsRouter(adRewardController));
app.use('/api/admin/mission-claims', createMissionClaimRouter(missionClaimsController));
app.use('/api/admin/ad-claims', createAdClaimRouter(adClaimController));

const dashboardRepository = new DashboardRepository();
const dashboardService = new DashboardService(dashboardRepository, adRewardRepository, missionRewardRepository);
const dashboardController = new DashboardController(dashboardService);

app.use('/api/admin/dashboard', createDashboardRouter(dashboardController));
app.use('/api/admin/users', usersRouter);

// Mobile API 라우터 설정 (API 키 인증 미들웨어 적용)
app.use('/api/mobile', apiKeyAuth, createMobileApiRouter(mobileApiController));

// 요청 로깅 미들웨어
app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`, {
        body: req.body,
        cookies: req.cookies,
    });
    next();
});

// 에러 핸들링
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
}); 