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

// 환경 변수 로드
if (process.env.NODE_ENV === 'test') {
    dotenv.config({ path: '.env.test' });
} else {
    dotenv.config();
}

const {
    MYSQL_HOST,
    MYSQL_PORT,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE
} = process.env;

if (!MYSQL_HOST || !MYSQL_PORT || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
    throw new Error('MySQL credentials are not properly configured');
}

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: MYSQL_HOST,
    port: parseInt(MYSQL_PORT, 10),
    username: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
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
        NotificationHistory
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