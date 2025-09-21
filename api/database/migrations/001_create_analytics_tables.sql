-- =====================================================
-- HAKUTO MON Advanced Analytics Database Schema
-- Version: 1.0.0
-- Purpose: 강력한 데이터 분석을 위한 새로운 테이블 구조
-- =====================================================

USE THEMOON_MON_SERVICE;

-- =====================================================
-- 1. 일일 통계 요약 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_analytics_summary (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL UNIQUE,
    
    -- NFT 관련 통계
    total_nft_holders INT DEFAULT 0,
    total_nfts_minted INT DEFAULT 0,
    total_staked_nfts INT DEFAULT 0,
    staking_ratio DECIMAL(5,2) DEFAULT 0.00,
    
    -- HKTM 토큰 관련 통계
    total_hktm_supply DECIMAL(20,8) DEFAULT 0,
    circulating_supply DECIMAL(20,8) DEFAULT 0,
    staked_hktm_amount DECIMAL(20,8) DEFAULT 0,
    burned_hktm_amount DECIMAL(20,8) DEFAULT 0,
    
    -- 거래 관련 통계
    daily_transactions INT DEFAULT 0,
    daily_volume DECIMAL(20,8) DEFAULT 0,
    daily_rewards_distributed DECIMAL(20,8) DEFAULT 0,
    daily_withdrawals DECIMAL(20,8) DEFAULT 0,
    
    -- 사용자 활동 통계
    active_users_count INT DEFAULT 0,
    new_users_count INT DEFAULT 0,
    staking_participants INT DEFAULT 0,
    
    -- 메타데이터
    data_source ENUM('onchain', 'database', 'hybrid') DEFAULT 'hybrid',
    validation_status ENUM('pending', 'validated', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_date (date),
    INDEX idx_validation_status (validation_status),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- 2. NFT 보유자 스냅샷 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS nft_holder_snapshots (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    snapshot_date DATE NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    
    -- NFT 정보
    contract_address VARCHAR(42) NOT NULL,
    contract_name VARCHAR(50) NOT NULL,
    token_ids JSON, -- 보유한 토큰 ID 목록
    token_count INT NOT NULL DEFAULT 0,
    
    -- 스테이킹 정보
    is_staking BOOLEAN DEFAULT FALSE,
    staked_token_ids JSON, -- 스테이킹한 토큰 ID 목록
    staked_count INT DEFAULT 0,
    staking_rewards_earned DECIMAL(20,8) DEFAULT 0,
    
    -- 거래 정보
    last_transaction_hash VARCHAR(66),
    last_transaction_date TIMESTAMP,
    
    -- 메타데이터
    data_source ENUM('moralis', 'database', 'manual') DEFAULT 'moralis',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_snapshot_date (snapshot_date),
    INDEX idx_wallet (wallet_address),
    INDEX idx_contract (contract_address),
    INDEX idx_staking (is_staking),
    UNIQUE KEY unique_snapshot (snapshot_date, wallet_address, contract_address)
);

-- =====================================================
-- 3. 토큰 유통 추적 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS token_circulation_tracking (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    timestamp TIMESTAMP NOT NULL,
    
    -- 공급량 정보
    total_supply DECIMAL(20,8) NOT NULL,
    circulating_supply DECIMAL(20,8) NOT NULL,
    
    -- 락업/스테이킹 정보
    staked_amount DECIMAL(20,8) DEFAULT 0,
    locked_amount DECIMAL(20,8) DEFAULT 0,
    team_locked_amount DECIMAL(20,8) DEFAULT 0,
    
    -- 소각 정보
    burned_amount DECIMAL(20,8) DEFAULT 0,
    burned_cumulative DECIMAL(20,8) DEFAULT 0,
    
    -- 거래소 관련
    exchange_balances JSON, -- 거래소별 잔고
    liquidity_pool_amount DECIMAL(20,8) DEFAULT 0,
    
    -- 가격 정보
    token_price_usd DECIMAL(20,8),
    market_cap_usd DECIMAL(20,8),
    
    -- 메타데이터
    block_number BIGINT,
    data_source VARCHAR(50) DEFAULT 'moralis',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_timestamp (timestamp),
    INDEX idx_block_number (block_number),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- 4. 실시간 거래 추적 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS realtime_transaction_tracking (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 거래 기본 정보
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    block_number BIGINT NOT NULL,
    block_timestamp TIMESTAMP NOT NULL,
    
    -- 거래 주체
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    
    -- 거래 내용
    transaction_type ENUM('transfer', 'stake', 'unstake', 'reward_claim', 'nft_transfer') NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    token_amount DECIMAL(20,8),
    token_ids JSON, -- NFT의 경우 토큰 ID
    
    -- 거래 분석
    is_large_transaction BOOLEAN DEFAULT FALSE,
    is_suspicious BOOLEAN DEFAULT FALSE,
    risk_score DECIMAL(3,2) DEFAULT 0.00,
    
    -- 가스 정보
    gas_used BIGINT,
    gas_price DECIMAL(20,8),
    transaction_fee DECIMAL(20,8),
    
    -- 메타데이터
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_transaction_hash (transaction_hash),
    INDEX idx_block_number (block_number),
    INDEX idx_block_timestamp (block_timestamp),
    INDEX idx_from_address (from_address),
    INDEX idx_to_address (to_address),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_contract_address (contract_address),
    INDEX idx_is_large_transaction (is_large_transaction),
    INDEX idx_is_suspicious (is_suspicious)
);

-- =====================================================
-- 5. 스테이킹 풀 상세 정보 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS staking_pool_analytics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    
    -- 풀 기본 정보
    pool_contract_address VARCHAR(42) NOT NULL,
    pool_name VARCHAR(100) NOT NULL,
    
    -- 스테이킹 통계
    total_staked_nfts INT DEFAULT 0,
    total_participants INT DEFAULT 0,
    total_rewards_pool DECIMAL(20,8) DEFAULT 0,
    distributed_rewards DECIMAL(20,8) DEFAULT 0,
    pending_rewards DECIMAL(20,8) DEFAULT 0,
    
    -- APY 계산
    current_apy DECIMAL(8,4) DEFAULT 0,
    average_apy_7d DECIMAL(8,4) DEFAULT 0,
    average_apy_30d DECIMAL(8,4) DEFAULT 0,
    
    -- 참여자 분석
    new_stakers_count INT DEFAULT 0,
    unstakers_count INT DEFAULT 0,
    avg_staking_duration_days DECIMAL(8,2) DEFAULT 0,
    
    -- 보상 분석
    rewards_per_nft DECIMAL(20,8) DEFAULT 0,
    top_earner_rewards DECIMAL(20,8) DEFAULT 0,
    median_rewards DECIMAL(20,8) DEFAULT 0,
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_date (date),
    INDEX idx_pool_contract (pool_contract_address),
    UNIQUE KEY unique_pool_date (date, pool_contract_address)
);

-- =====================================================
-- 6. 지갑 행동 분석 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS wallet_behavior_analytics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    wallet_address VARCHAR(42) NOT NULL,
    analysis_date DATE NOT NULL,
    
    -- 보유 자산 분석
    total_nfts_owned INT DEFAULT 0,
    total_nfts_staked INT DEFAULT 0,
    total_hktm_balance DECIMAL(20,8) DEFAULT 0,
    portfolio_value_usd DECIMAL(20,8) DEFAULT 0,
    
    -- 거래 행동 분석
    transactions_count_7d INT DEFAULT 0,
    transactions_count_30d INT DEFAULT 0,
    avg_transaction_size DECIMAL(20,8) DEFAULT 0,
    largest_transaction DECIMAL(20,8) DEFAULT 0,
    
    -- 스테이킹 행동
    staking_duration_days INT DEFAULT 0,
    total_rewards_earned DECIMAL(20,8) DEFAULT 0,
    rewards_claimed DECIMAL(20,8) DEFAULT 0,
    rewards_pending DECIMAL(20,8) DEFAULT 0,
    
    -- 위험도 분석
    risk_score DECIMAL(3,2) DEFAULT 0.00,
    behavior_flags JSON, -- 이상 행동 플래그들
    
    -- 분류
    wallet_category ENUM('whale', 'regular', 'small', 'inactive', 'suspicious') DEFAULT 'regular',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 메타데이터
    last_activity_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_analysis_date (analysis_date),
    INDEX idx_wallet_category (wallet_category),
    INDEX idx_risk_score (risk_score),
    UNIQUE KEY unique_wallet_date (wallet_address, analysis_date)
);

-- =====================================================
-- 7. 데이터 검증 로그 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS data_validation_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 검증 정보
    validation_type ENUM('daily_summary', 'circulation', 'staking', 'rewards', 'nft_holders') NOT NULL,
    validation_date DATE NOT NULL,
    
    -- 검증 결과
    status ENUM('passed', 'failed', 'warning') NOT NULL,
    
    -- 데이터 소스 비교
    database_value DECIMAL(20,8),
    onchain_value DECIMAL(20,8),
    difference_amount DECIMAL(20,8),
    difference_percentage DECIMAL(5,2),
    
    -- 오류 정보
    error_message TEXT,
    error_details JSON,
    
    -- 수정 정보
    auto_corrected BOOLEAN DEFAULT FALSE,
    correction_applied TEXT,
    
    -- 메타데이터
    validator_service VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_validation_type (validation_type),
    INDEX idx_validation_date (validation_date),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- 8. 알림 및 이상 탐지 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS anomaly_detection_alerts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 알림 기본 정보
    alert_type ENUM('large_transfer', 'unusual_staking', 'price_manipulation', 'circulation_anomaly', 'reward_anomaly') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    
    -- 탐지 정보
    detected_at TIMESTAMP NOT NULL,
    entity_type ENUM('wallet', 'transaction', 'contract', 'pool') NOT NULL,
    entity_id VARCHAR(100) NOT NULL, -- 지갑 주소, 트랜잭션 해시 등
    
    -- 이상 내용
    description TEXT NOT NULL,
    threshold_value DECIMAL(20,8),
    actual_value DECIMAL(20,8),
    deviation_percentage DECIMAL(5,2),
    
    -- 상세 정보
    metadata JSON,
    
    -- 처리 상태
    status ENUM('new', 'investigating', 'resolved', 'false_positive') DEFAULT 'new',
    assigned_to VARCHAR(100),
    resolution_notes TEXT,
    resolved_at TIMESTAMP,
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_alert_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_detected_at (detected_at),
    INDEX idx_entity_type (entity_type),
    INDEX idx_entity_id (entity_id),
    INDEX idx_status (status)
);

-- =====================================================
-- 9. 컴플라이언스 리포트 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance_reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 리포트 정보
    report_type ENUM('daily', 'weekly', 'monthly', 'exchange_submission') NOT NULL,
    report_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- 리포트 내용 (JSON 형태로 저장)
    token_metrics JSON NOT NULL,
    nft_metrics JSON NOT NULL,
    staking_metrics JSON NOT NULL,
    transaction_metrics JSON NOT NULL,
    
    -- 검증 정보
    validation_status ENUM('pending', 'validated', 'failed') DEFAULT 'pending',
    validator_signature VARCHAR(255),
    
    -- 파일 정보
    report_file_path VARCHAR(500),
    report_hash VARCHAR(64), -- SHA-256 해시
    
    -- 제출 정보
    submitted_to VARCHAR(100), -- 거래소명 등
    submitted_at TIMESTAMP,
    submission_status ENUM('pending', 'submitted', 'accepted', 'rejected'),
    
    -- 메타데이터
    generated_by VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_report_type (report_type),
    INDEX idx_report_date (report_date),
    INDEX idx_validation_status (validation_status),
    INDEX idx_submission_status (submission_status)
);

-- =====================================================
-- 10. 성능 메트릭 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS system_performance_metrics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 시간 정보
    timestamp TIMESTAMP NOT NULL,
    
    -- API 성능
    api_response_time_ms INT,
    api_success_rate DECIMAL(5,2),
    api_error_count INT DEFAULT 0,
    
    -- 데이터 수집 성능
    moralis_api_calls INT DEFAULT 0,
    moralis_rate_limit_hits INT DEFAULT 0,
    database_query_time_ms INT,
    
    -- 시스템 리소스
    cpu_usage_percent DECIMAL(5,2),
    memory_usage_percent DECIMAL(5,2),
    disk_usage_percent DECIMAL(5,2),
    
    -- 데이터 품질
    data_accuracy_score DECIMAL(5,2),
    validation_success_rate DECIMAL(5,2),
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_timestamp (timestamp),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- 뷰 생성: 대시보드용 요약 뷰
-- =====================================================

-- 최신 일일 요약 뷰
CREATE OR REPLACE VIEW v_latest_daily_summary AS
SELECT * FROM daily_analytics_summary 
WHERE date = (SELECT MAX(date) FROM daily_analytics_summary);

-- 토큰 유통 현황 뷰
CREATE OR REPLACE VIEW v_current_token_circulation AS
SELECT * FROM token_circulation_tracking 
WHERE timestamp = (SELECT MAX(timestamp) FROM token_circulation_tracking);

-- 활성 스테이킹 풀 뷰
CREATE OR REPLACE VIEW v_active_staking_pools AS
SELECT * FROM staking_pool_analytics 
WHERE date = (SELECT MAX(date) FROM staking_pool_analytics);

-- 상위 지갑 홀더 뷰
CREATE OR REPLACE VIEW v_top_wallet_holders AS
SELECT 
    wallet_address,
    SUM(token_count) as total_nfts,
    SUM(staked_count) as total_staked,
    MAX(analysis_date) as last_analysis
FROM nft_holder_snapshots 
WHERE snapshot_date = (SELECT MAX(snapshot_date) FROM nft_holder_snapshots)
GROUP BY wallet_address
ORDER BY total_nfts DESC
LIMIT 100;

-- =====================================================
-- 초기 데이터 및 설정
-- =====================================================

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS analytics_system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 기본 설정 값 삽입
INSERT INTO analytics_system_config (config_key, config_value, description) VALUES
('moralis_api_key', '', 'Moralis API 키'),
('data_collection_interval', '300', '데이터 수집 간격 (초)'),
('validation_threshold', '0.05', '데이터 검증 임계값 (5%)'),
('large_transaction_threshold', '10000', '대량 거래 임계값 (HKTM)'),
('whale_threshold', '100', '고래 지갑 임계값 (NFT 개수)'),
('anomaly_detection_enabled', 'true', '이상 탐지 활성화 여부'),
('auto_correction_enabled', 'false', '자동 수정 활성화 여부')
ON DUPLICATE KEY UPDATE 
    config_value = VALUES(config_value),
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- 완료 메시지
-- =====================================================
SELECT 'Analytics database schema created successfully!' as status;
