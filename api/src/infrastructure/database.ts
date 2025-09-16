import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { AdminUser } from '../domain/entities/admin_user.entity';
import { WalletUser } from '../domain/entities/wallet_user.entity';
import { EmailVerificationAttempt } from '../domain/entities/email_verification_attempt.entity';
import { NotificationLog } from '../domain/entities/notification_log.entity';
import { AlertRule } from '../domain/entities/alert_rule.entity';
import { Event } from '../domain/entities/event.entity';
import { Portfolio } from '../domain/entities/portfolio.entity';
import { PortfolioHistory } from '../domain/entities/portfolio_history.entity';
import { TelegramConnection } from '../domain/entities/telegram_connection.entity';
import { NotificationHistory } from '../domain/entities/notification_history.entity';
import { AssetPrice } from '../domain/entities/asset_price.entity';

// 환경 변수 로드
if (process.env.NODE_ENV === 'test') {
    dotenv.config({ path: '.env.test' });
} else {
    dotenv.config();
}

const {
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_DATABASE,
    // 기존 MYSQL_ 형식도 지원 (하위 호환성)
    MYSQL_HOST,
    MYSQL_PORT,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE
} = process.env;

// DB_ 형식을 우선 사용하고, 없으면 MYSQL_ 형식 사용
const dbHost = DB_HOST || MYSQL_HOST;
const dbPort = DB_PORT || MYSQL_PORT;
const dbUser = DB_USERNAME || MYSQL_USER;
const dbPassword = DB_PASSWORD || MYSQL_PASSWORD;
const dbDatabase = DB_DATABASE || MYSQL_DATABASE;

if (!dbHost || !dbPort || !dbUser || !dbPassword || !dbDatabase) {
    console.error('Missing database configuration:', {
        host: !!dbHost,
        port: !!dbPort,
        user: !!dbUser,
        password: !!dbPassword,
        database: !!dbDatabase
    });
    throw new Error('Database credentials are not properly configured. Please check DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE environment variables.');
}

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: dbHost,
    port: parseInt(dbPort, 10),
    username: dbUser,
    password: dbPassword,
    database: dbDatabase,
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    entities: [
        AdminUser,
        WalletUser,
        EmailVerificationAttempt,
        NotificationLog,
        AlertRule,
        Event,
        Portfolio,
        PortfolioHistory,
        TelegramConnection,
        NotificationHistory,
        AssetPrice
    ],
    migrations: [
        process.env.NODE_ENV === 'production'
            ? 'dist/infrastructure/migrations/**/*.js'
            : 'src/infrastructure/migrations/**/*.ts'
    ],
    subscribers: [
        process.env.NODE_ENV === 'production'
            ? 'dist/infrastructure/subscribers/**/*.js'
            : 'src/infrastructure/subscribers/**/*.ts'
    ],
});

// 데이터베이스 연결 테스트
AppDataSource.initialize()
    .then(() => {
        console.log('[mysql] Database connection initialized successfully');
    })
    .catch((error) => {
        console.error('[mysql] Error during database initialization:', error);
    }); 