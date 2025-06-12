import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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
        process.env.NODE_ENV === 'production'
            ? 'dist/domain/entities/**/*.js'
            : 'src/domain/entities/**/*.ts'
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