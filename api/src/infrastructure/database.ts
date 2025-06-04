import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

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
    entities: ['src/domain/entities/**/*.ts'],
    migrations: ['src/infrastructure/migrations/**/*.ts'],
    subscribers: ['src/infrastructure/subscribers/**/*.ts'],
});

// 데이터베이스 연결 테스트
AppDataSource.initialize()
    .then(() => {
        console.log('[mysql] Database connection initialized successfully');
    })
    .catch((error) => {
        console.error('[mysql] Error during database initialization:', error);
    }); 