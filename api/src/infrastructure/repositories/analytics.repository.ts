import { AppDataSource } from '../database';

// 분석 데이터 인터페이스들
export interface DailyAnalyticsSummary {
    id?: number;
    summary_date: Date;
    total_nft_holders: number;
    total_staked_nfts: number;
    total_hktm_supply: string;
    total_hktm_circulation: string;
    total_hktm_staked: string;
    daily_transactions: number;
    daily_volume_usd: string;
    daily_rewards_distributed: string;
    daily_withdrawals: string;
    active_wallets: number;
    new_wallets: number;
    avg_gas_price: string;
    network_health_score: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface NFTHolderSnapshot {
    id?: number;
    snapshot_date: Date;
    wallet_address: string;
    nft_count: number;
    staked_nft_count: number;
    total_rewards_earned: string;
    last_activity_date: Date;
    holder_tier: 'whale' | 'dolphin' | 'fish' | 'shrimp';
    staking_duration_days: number;
    is_active_staker: boolean;
    created_at?: Date;
}

export interface TokenCirculationTracking {
    id?: number;
    tracking_date: Date;
    token_address: string;
    token_symbol: string;
    total_supply: string;
    circulating_supply: string;
    burned_amount: string;
    locked_amount: string;
    staked_amount: string;
    exchange_reserves: string;
    holder_count: number;
    top_10_holder_percentage: number;
    gini_coefficient: number;
    created_at?: Date;
}

export interface RealtimeTransactionTracking {
    id?: number;
    transaction_hash: string;
    block_number: number;
    transaction_timestamp: Date;
    from_address: string;
    to_address: string;
    token_address: string;
    amount: string;
    transaction_type: 'transfer' | 'stake' | 'unstake' | 'reward' | 'burn' | 'mint';
    gas_used: string;
    gas_price: string;
    usd_value: string;
    is_suspicious: boolean;
    risk_score: number;
    created_at?: Date;
}

export interface StakingPoolAnalytics {
    id?: number;
    analysis_date: Date;
    pool_contract_address: string;
    total_staked_amount: string;
    total_stakers: number;
    avg_stake_amount: string;
    total_rewards_distributed: string;
    apy_percentage: number;
    pool_utilization_rate: number;
    avg_staking_duration: number;
    new_stakers_count: number;
    unstaked_count: number;
    pool_health_score: number;
    created_at?: Date;
}

export interface WalletBehaviorAnalytics {
    id?: number;
    analysis_date: Date;
    wallet_address: string;
    transaction_count: number;
    total_volume_usd: string;
    avg_transaction_size: string;
    preferred_transaction_time: number; // 0-23 시간
    gas_efficiency_score: number;
    behavior_pattern: 'hodler' | 'trader' | 'staker' | 'arbitrageur' | 'bot';
    risk_level: 'low' | 'medium' | 'high';
    loyalty_score: number;
    created_at?: Date;
}

export interface DataValidationLog {
    id?: number;
    validation_timestamp: Date;
    data_source: string;
    validation_type: 'consistency' | 'accuracy' | 'completeness' | 'integrity';
    validation_status: 'passed' | 'failed' | 'warning';
    error_details?: string;
    affected_records: number;
    correction_applied: boolean;
    validator_name: string;
    created_at?: Date;
}

export interface AnomalyDetectionAlert {
    id?: number;
    detection_timestamp: Date;
    anomaly_type: 'price_spike' | 'volume_spike' | 'unusual_transfer' | 'gas_anomaly' | 'holder_change';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affected_entity: string; // wallet address, contract address, etc.
    metric_value: string;
    threshold_value: string;
    confidence_score: number;
    status: 'new' | 'investigating' | 'resolved' | 'false_positive';
    assigned_to?: string;
    resolved_at?: Date;
    created_at?: Date;
}

export interface ComplianceReport {
    id?: number;
    report_type: 'daily' | 'weekly' | 'monthly' | 'exchange_submission';
    report_date: Date;
    period_start: Date;
    period_end: Date;
    token_metrics: any; // JSON
    nft_metrics: any; // JSON
    staking_metrics: any; // JSON
    transaction_metrics: any; // JSON
    validation_status: 'pending' | 'validated' | 'failed';
    validator_signature?: string;
    report_file_path?: string;
    report_hash?: string;
    submitted_to?: string;
    submitted_at?: Date;
    submission_status: 'pending' | 'submitted' | 'accepted' | 'rejected';
    generated_by: string;
    created_at?: Date;
}

export interface SystemPerformanceMetrics {
    id?: number;
    metric_timestamp: Date;
    metric_date: Date;
    api_response_time_avg?: number;
    api_response_time_p95?: number;
    api_request_count: number;
    api_error_count: number;
    api_success_rate?: number;
    db_query_time_avg?: number;
    db_connection_count: number;
    db_slow_query_count: number;
    external_api_calls: number;
    external_api_failures: number;
    external_api_latency_avg?: number;
    data_processing_time?: number;
    records_processed: number;
    data_validation_errors: number;
    cpu_usage_percent?: number;
    memory_usage_percent?: number;
    disk_usage_percent?: number;
    cache_hit_rate?: number;
    cache_miss_count: number;
    alert_count: number;
    critical_error_count: number;
    created_at?: Date;
}

/**
 * Analytics Repository
 * 새로운 분석 시스템의 모든 데이터베이스 상호작용을 담당
 */
export class AnalyticsRepository {
    private dataSource = AppDataSource;

    constructor() {
        if (!this.dataSource.isInitialized) {
            console.warn('[AnalyticsRepository] DataSource not initialized yet');
        }
    }

    // ===========================================
    // Daily Analytics Summary 관련 메서드
    // ===========================================

    async insertDailyAnalyticsSummary(data: DailyAnalyticsSummary): Promise<void> {
        const query = `
            INSERT INTO daily_analytics_summary (
                summary_date, total_nft_holders, total_staked_nfts, total_hktm_supply,
                total_hktm_circulation, total_hktm_staked, daily_transactions, daily_volume_usd,
                daily_rewards_distributed, daily_withdrawals, active_wallets, new_wallets,
                avg_gas_price, network_health_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                total_nft_holders = VALUES(total_nft_holders),
                total_staked_nfts = VALUES(total_staked_nfts),
                total_hktm_supply = VALUES(total_hktm_supply),
                total_hktm_circulation = VALUES(total_hktm_circulation),
                total_hktm_staked = VALUES(total_hktm_staked),
                daily_transactions = VALUES(daily_transactions),
                daily_volume_usd = VALUES(daily_volume_usd),
                daily_rewards_distributed = VALUES(daily_rewards_distributed),
                daily_withdrawals = VALUES(daily_withdrawals),
                active_wallets = VALUES(active_wallets),
                new_wallets = VALUES(new_wallets),
                avg_gas_price = VALUES(avg_gas_price),
                network_health_score = VALUES(network_health_score),
                updated_at = CURRENT_TIMESTAMP
        `;

        await this.dataSource.query(query, [
            data.summary_date, data.total_nft_holders, data.total_staked_nfts, data.total_hktm_supply,
            data.total_hktm_circulation, data.total_hktm_staked, data.daily_transactions, data.daily_volume_usd,
            data.daily_rewards_distributed, data.daily_withdrawals, data.active_wallets, data.new_wallets,
            data.avg_gas_price, data.network_health_score
        ]);
    }

    async getDailyAnalyticsSummary(startDate: Date, endDate: Date): Promise<DailyAnalyticsSummary[]> {
        const query = `
            SELECT * FROM daily_analytics_summary
            WHERE summary_date BETWEEN ? AND ?
            ORDER BY summary_date DESC
        `;
        
        return await this.dataSource.query(query, [startDate, endDate]);
    }

    async getLatestDailyAnalytics(): Promise<DailyAnalyticsSummary | null> {
        const query = `
            SELECT * FROM daily_analytics_summary
            ORDER BY summary_date DESC
            LIMIT 1
        `;
        
        const result = await this.dataSource.query(query);
        return result.length > 0 ? result[0] : null;
    }

    // ===========================================
    // NFT Holder Snapshots 관련 메서드
    // ===========================================

    async insertNFTHolderSnapshot(data: NFTHolderSnapshot): Promise<void> {
        const query = `
            INSERT INTO nft_holder_snapshots (
                snapshot_date, wallet_address, nft_count, staked_nft_count,
                total_rewards_earned, last_activity_date, holder_tier,
                staking_duration_days, is_active_staker
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.dataSource.query(query, [
            data.snapshot_date, data.wallet_address, data.nft_count, data.staked_nft_count,
            data.total_rewards_earned, data.last_activity_date, data.holder_tier,
            data.staking_duration_days, data.is_active_staker
        ]);
    }

    async getNFTHolderSnapshots(date: Date): Promise<NFTHolderSnapshot[]> {
        const query = `
            SELECT * FROM nft_holder_snapshots
            WHERE snapshot_date = ?
            ORDER BY nft_count DESC
        `;
        
        return await this.dataSource.query(query, [date]);
    }

    async getNFTHolderHistory(walletAddress: string, days: number = 30): Promise<NFTHolderSnapshot[]> {
        const query = `
            SELECT * FROM nft_holder_snapshots
            WHERE wallet_address = ? 
            AND snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            ORDER BY snapshot_date DESC
        `;
        
        return await this.dataSource.query(query, [walletAddress, days]);
    }

    // ===========================================
    // Token Circulation Tracking 관련 메서드
    // ===========================================

    async insertTokenCirculationTracking(data: TokenCirculationTracking): Promise<void> {
        const query = `
            INSERT INTO token_circulation_tracking (
                tracking_date, token_address, token_symbol, total_supply,
                circulating_supply, burned_amount, locked_amount, staked_amount,
                exchange_reserves, holder_count, top_10_holder_percentage, gini_coefficient
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                total_supply = VALUES(total_supply),
                circulating_supply = VALUES(circulating_supply),
                burned_amount = VALUES(burned_amount),
                locked_amount = VALUES(locked_amount),
                staked_amount = VALUES(staked_amount),
                exchange_reserves = VALUES(exchange_reserves),
                holder_count = VALUES(holder_count),
                top_10_holder_percentage = VALUES(top_10_holder_percentage),
                gini_coefficient = VALUES(gini_coefficient)
        `;

        await this.dataSource.query(query, [
            data.tracking_date, data.token_address, data.token_symbol, data.total_supply,
            data.circulating_supply, data.burned_amount, data.locked_amount, data.staked_amount,
            data.exchange_reserves, data.holder_count, data.top_10_holder_percentage, data.gini_coefficient
        ]);
    }

    async getTokenCirculationHistory(tokenAddress: string, days: number = 30): Promise<TokenCirculationTracking[]> {
        const query = `
            SELECT * FROM token_circulation_tracking
            WHERE token_address = ? 
            AND tracking_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            ORDER BY tracking_date DESC
        `;
        
        return await this.dataSource.query(query, [tokenAddress, days]);
    }

    // ===========================================
    // Realtime Transaction Tracking 관련 메서드
    // ===========================================

    async insertRealtimeTransaction(data: RealtimeTransactionTracking): Promise<void> {
        const query = `
            INSERT IGNORE INTO realtime_transaction_tracking (
                transaction_hash, block_number, transaction_timestamp, from_address,
                to_address, token_address, amount, transaction_type, gas_used,
                gas_price, usd_value, is_suspicious, risk_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.dataSource.query(query, [
            data.transaction_hash, data.block_number, data.transaction_timestamp, data.from_address,
            data.to_address, data.token_address, data.amount, data.transaction_type, data.gas_used,
            data.gas_price, data.usd_value, data.is_suspicious, data.risk_score
        ]);
    }

    async getRecentTransactions(limit: number = 100): Promise<RealtimeTransactionTracking[]> {
        const query = `
            SELECT * FROM realtime_transaction_tracking
            ORDER BY transaction_timestamp DESC
            LIMIT ?
        `;
        
        return await this.dataSource.query(query, [limit]);
    }

    async getSuspiciousTransactions(days: number = 7): Promise<RealtimeTransactionTracking[]> {
        const query = `
            SELECT * FROM realtime_transaction_tracking
            WHERE is_suspicious = true 
            AND transaction_timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ORDER BY risk_score DESC, transaction_timestamp DESC
        `;
        
        return await this.dataSource.query(query, [days]);
    }

    // ===========================================
    // Staking Pool Analytics 관련 메서드
    // ===========================================

    async insertStakingPoolAnalytics(data: StakingPoolAnalytics): Promise<void> {
        const query = `
            INSERT INTO staking_pool_analytics (
                analysis_date, pool_contract_address, total_staked_amount, total_stakers,
                avg_stake_amount, total_rewards_distributed, apy_percentage, pool_utilization_rate,
                avg_staking_duration, new_stakers_count, unstaked_count, pool_health_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                total_staked_amount = VALUES(total_staked_amount),
                total_stakers = VALUES(total_stakers),
                avg_stake_amount = VALUES(avg_stake_amount),
                total_rewards_distributed = VALUES(total_rewards_distributed),
                apy_percentage = VALUES(apy_percentage),
                pool_utilization_rate = VALUES(pool_utilization_rate),
                avg_staking_duration = VALUES(avg_staking_duration),
                new_stakers_count = VALUES(new_stakers_count),
                unstaked_count = VALUES(unstaked_count),
                pool_health_score = VALUES(pool_health_score)
        `;

        await this.dataSource.query(query, [
            data.analysis_date, data.pool_contract_address, data.total_staked_amount, data.total_stakers,
            data.avg_stake_amount, data.total_rewards_distributed, data.apy_percentage, data.pool_utilization_rate,
            data.avg_staking_duration, data.new_stakers_count, data.unstaked_count, data.pool_health_score
        ]);
    }

    async getStakingPoolAnalytics(poolAddress: string, days: number = 30): Promise<StakingPoolAnalytics[]> {
        const query = `
            SELECT * FROM staking_pool_analytics
            WHERE pool_contract_address = ? 
            AND analysis_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            ORDER BY analysis_date DESC
        `;
        
        return await this.dataSource.query(query, [poolAddress, days]);
    }

    // ===========================================
    // Wallet Behavior Analytics 관련 메서드
    // ===========================================

    async insertWalletBehaviorAnalytics(data: WalletBehaviorAnalytics): Promise<void> {
        const query = `
            INSERT INTO wallet_behavior_analytics (
                analysis_date, wallet_address, transaction_count, total_volume_usd,
                avg_transaction_size, preferred_transaction_time, gas_efficiency_score,
                behavior_pattern, risk_level, loyalty_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                transaction_count = VALUES(transaction_count),
                total_volume_usd = VALUES(total_volume_usd),
                avg_transaction_size = VALUES(avg_transaction_size),
                preferred_transaction_time = VALUES(preferred_transaction_time),
                gas_efficiency_score = VALUES(gas_efficiency_score),
                behavior_pattern = VALUES(behavior_pattern),
                risk_level = VALUES(risk_level),
                loyalty_score = VALUES(loyalty_score)
        `;

        await this.dataSource.query(query, [
            data.analysis_date, data.wallet_address, data.transaction_count, data.total_volume_usd,
            data.avg_transaction_size, data.preferred_transaction_time, data.gas_efficiency_score,
            data.behavior_pattern, data.risk_level, data.loyalty_score
        ]);
    }

    async getWalletBehaviorAnalytics(walletAddress: string, days: number = 30): Promise<WalletBehaviorAnalytics[]> {
        const query = `
            SELECT * FROM wallet_behavior_analytics
            WHERE wallet_address = ? 
            AND analysis_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            ORDER BY analysis_date DESC
        `;
        
        return await this.dataSource.query(query, [walletAddress, days]);
    }

    // ===========================================
    // Data Validation Log 관련 메서드
    // ===========================================

    async insertDataValidationLog(data: DataValidationLog): Promise<void> {
        const query = `
            INSERT INTO data_validation_logs (
                validation_timestamp, data_source, validation_type, validation_status,
                error_details, affected_records, correction_applied, validator_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.dataSource.query(query, [
            data.validation_timestamp, data.data_source, data.validation_type, data.validation_status,
            data.error_details, data.affected_records, data.correction_applied, data.validator_name
        ]);
    }

    async getDataValidationLogs(days: number = 7): Promise<DataValidationLog[]> {
        const query = `
            SELECT * FROM data_validation_logs
            WHERE validation_timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ORDER BY validation_timestamp DESC
        `;
        
        return await this.dataSource.query(query, [days]);
    }

    // ===========================================
    // Anomaly Detection Alert 관련 메서드
    // ===========================================

    async insertAnomalyDetectionAlert(data: AnomalyDetectionAlert): Promise<void> {
        const query = `
            INSERT INTO anomaly_detection_alerts (
                detection_timestamp, anomaly_type, severity, description, affected_entity,
                metric_value, threshold_value, confidence_score, status, assigned_to
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.dataSource.query(query, [
            data.detection_timestamp, data.anomaly_type, data.severity, data.description, data.affected_entity,
            data.metric_value, data.threshold_value, data.confidence_score, data.status, data.assigned_to
        ]);
    }

    async getActiveAnomalyAlerts(): Promise<AnomalyDetectionAlert[]> {
        const query = `
            SELECT * FROM anomaly_detection_alerts
            WHERE status IN ('new', 'investigating')
            ORDER BY severity DESC, detection_timestamp DESC
        `;
        
        return await this.dataSource.query(query);
    }

    async updateAnomalyAlertStatus(alertId: number, status: string, assignedTo?: string): Promise<void> {
        const query = `
            UPDATE anomaly_detection_alerts 
            SET status = ?, assigned_to = ?, resolved_at = CASE WHEN ? = 'resolved' THEN NOW() ELSE resolved_at END
            WHERE id = ?
        `;

        await this.dataSource.query(query, [status, assignedTo, status, alertId]);
    }

    // ===========================================
    // Compliance Report 관련 메서드
    // ===========================================

    async insertComplianceReport(data: ComplianceReport): Promise<number> {
        const query = `
            INSERT INTO compliance_reports (
                report_type, report_date, period_start, period_end, token_metrics,
                nft_metrics, staking_metrics, transaction_metrics, validation_status,
                validator_signature, report_file_path, report_hash, submitted_to,
                submitted_at, submission_status, generated_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await this.dataSource.query(query, [
            data.report_type, data.report_date, data.period_start, data.period_end, JSON.stringify(data.token_metrics),
            JSON.stringify(data.nft_metrics), JSON.stringify(data.staking_metrics), JSON.stringify(data.transaction_metrics), 
            data.validation_status, data.validator_signature, data.report_file_path, data.report_hash, 
            data.submitted_to, data.submitted_at, data.submission_status, data.generated_by
        ]);

        return result.insertId;
    }

    async getComplianceReports(reportType?: string, limit: number = 50): Promise<ComplianceReport[]> {
        let query = `
            SELECT * FROM compliance_reports
        `;
        const params: any[] = [];

        if (reportType) {
            query += ` WHERE report_type = ?`;
            params.push(reportType);
        }

        query += ` ORDER BY report_date DESC LIMIT ?`;
        params.push(limit);
        
        return await this.dataSource.query(query, params);
    }

    // ===========================================
    // System Performance Metrics 관련 메서드
    // ===========================================

    async insertSystemPerformanceMetrics(data: SystemPerformanceMetrics): Promise<void> {
        const query = `
            INSERT INTO system_performance_metrics (
                metric_timestamp, metric_date, api_response_time_avg, api_response_time_p95,
                api_request_count, api_error_count, api_success_rate, db_query_time_avg,
                db_connection_count, db_slow_query_count, external_api_calls, external_api_failures,
                external_api_latency_avg, data_processing_time, records_processed, data_validation_errors,
                cpu_usage_percent, memory_usage_percent, disk_usage_percent, cache_hit_rate,
                cache_miss_count, alert_count, critical_error_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.dataSource.query(query, [
            data.metric_timestamp, data.metric_date, data.api_response_time_avg, data.api_response_time_p95,
            data.api_request_count, data.api_error_count, data.api_success_rate, data.db_query_time_avg,
            data.db_connection_count, data.db_slow_query_count, data.external_api_calls, data.external_api_failures,
            data.external_api_latency_avg, data.data_processing_time, data.records_processed, data.data_validation_errors,
            data.cpu_usage_percent, data.memory_usage_percent, data.disk_usage_percent, data.cache_hit_rate,
            data.cache_miss_count, data.alert_count, data.critical_error_count
        ]);
    }

    async getSystemPerformanceMetrics(hours: number = 24): Promise<SystemPerformanceMetrics[]> {
        const query = `
            SELECT * FROM system_performance_metrics
            WHERE metric_timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
            ORDER BY metric_timestamp DESC
        `;
        
        return await this.dataSource.query(query, [hours]);
    }

    // ===========================================
    // 통합 분석 메서드들
    // ===========================================

    async getExecutiveDashboardData(): Promise<any> {
        const queries = {
            latestSummary: `SELECT * FROM daily_analytics_summary ORDER BY summary_date DESC LIMIT 1`,
            activeAlerts: `SELECT COUNT(*) as count FROM anomaly_detection_alerts WHERE status IN ('new', 'investigating')`,
            systemHealth: `SELECT AVG(api_success_rate) as avg_success_rate, AVG(network_health_score) as avg_health_score FROM daily_analytics_summary WHERE summary_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
            recentTransactions: `SELECT COUNT(*) as count FROM realtime_transaction_tracking WHERE transaction_timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`
        };

        const results = await Promise.all([
            this.dataSource.query(queries.latestSummary),
            this.dataSource.query(queries.activeAlerts),
            this.dataSource.query(queries.systemHealth),
            this.dataSource.query(queries.recentTransactions)
        ]);

        return {
            latestSummary: results[0][0] || null,
            activeAlerts: results[1][0]?.count || 0,
            systemHealth: results[2][0] || null,
            recentTransactions: results[3][0]?.count || 0
        };
    }

    async getTokenomicsOverview(tokenAddress: string): Promise<any> {
        const query = `
            SELECT 
                total_supply,
                circulating_supply,
                burned_amount,
                locked_amount,
                staked_amount,
                exchange_reserves,
                holder_count,
                top_10_holder_percentage,
                gini_coefficient,
                tracking_date
            FROM token_circulation_tracking
            WHERE token_address = ?
            ORDER BY tracking_date DESC
            LIMIT 30
        `;
        
        return await this.dataSource.query(query, [tokenAddress]);
    }
}