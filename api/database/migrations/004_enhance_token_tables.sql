-- HKTM 토큰 분석을 위한 테이블 스키마 개선
-- 기존 token_holders_snapshot 테이블에 필드 추가

-- 1. token_holders_snapshot 테이블에 필드 추가
ALTER TABLE token_holders_snapshot 
ADD COLUMN IF NOT EXISTS block_timestamp TIMESTAMP NULL COMMENT '블록 타임스탬프',
ADD COLUMN IF NOT EXISTS last_updated_timestamp TIMESTAMP NULL COMMENT '마지막 업데이트 시간',
ADD COLUMN IF NOT EXISTS first_seen_date DATE NULL COMMENT '최초 홀딩 시작일',
ADD COLUMN IF NOT EXISTS token_version VARCHAR(10) NULL COMMENT '토큰 버전 (v1, v2)',
ADD COLUMN IF NOT EXISTS is_active_holder BOOLEAN DEFAULT TRUE COMMENT '활성 홀더 여부',
ADD COLUMN IF NOT EXISTS holder_rank INT NULL COMMENT '홀더 순위',
ADD COLUMN IF NOT EXISTS previous_balance VARCHAR(78) NULL COMMENT '이전 잔액 (변화 추적용)',
ADD COLUMN IF NOT EXISTS balance_change_amount VARCHAR(78) NULL COMMENT '잔액 변화량',
ADD COLUMN IF NOT EXISTS balance_change_percentage DECIMAL(10,4) NULL COMMENT '잔액 변화율 (%)',
ADD COLUMN IF NOT EXISTS transaction_count INT DEFAULT 0 COMMENT '거래 횟수';

-- 인덱스 추가
ALTER TABLE token_holders_snapshot 
ADD INDEX IF NOT EXISTS idx_token_version (token_version),
ADD INDEX IF NOT EXISTS idx_is_active (is_active_holder),
ADD INDEX IF NOT EXISTS idx_holder_rank (holder_rank),
ADD INDEX IF NOT EXISTS idx_first_seen (first_seen_date),
ADD INDEX IF NOT EXISTS idx_block_timestamp (block_timestamp);

-- 2. 토큰 전송 추적 테이블 생성 (HKTM v1/v2 전송 내역 상세 추적)
CREATE TABLE IF NOT EXISTS token_transfers_tracking (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 기본 전송 정보
    transaction_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    block_timestamp TIMESTAMP NOT NULL,
    log_index INT NOT NULL,
    
    -- 토큰 정보
    token_address VARCHAR(42) NOT NULL,
    token_name VARCHAR(100),
    token_symbol VARCHAR(20),
    token_version VARCHAR(10) COMMENT 'v1, v2',
    
    -- 전송 정보
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    value VARCHAR(78) NOT NULL COMMENT '전송량 (raw)',
    value_formatted DECIMAL(36,18) COMMENT '전송량 (formatted)',
    
    -- 분석 정보
    transfer_type ENUM('mint', 'burn', 'transfer', 'swap', 'stake', 'unstake') DEFAULT 'transfer',
    is_large_transfer BOOLEAN DEFAULT FALSE COMMENT '대량 전송 여부',
    usd_value DECIMAL(20,8) COMMENT 'USD 가치',
    
    -- 메타 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_token_address (token_address),
    INDEX idx_from_address (from_address),
    INDEX idx_to_address (to_address),
    INDEX idx_block_number (block_number),
    INDEX idx_block_timestamp (block_timestamp),
    INDEX idx_transaction_hash (transaction_hash),
    INDEX idx_token_version (token_version),
    INDEX idx_transfer_type (transfer_type),
    INDEX idx_is_large (is_large_transfer),
    
    UNIQUE KEY uk_transfer (transaction_hash, log_index)
);

-- 3. 토큰 홀더 변화 추적 테이블 (일일 변화량 추적)
CREATE TABLE IF NOT EXISTS token_holder_changes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 토큰 정보
    token_address VARCHAR(42) NOT NULL,
    token_version VARCHAR(10) COMMENT 'v1, v2',
    
    -- 홀더 정보
    owner_address VARCHAR(42) NOT NULL,
    
    -- 변화 정보
    change_date DATE NOT NULL,
    previous_balance VARCHAR(78) COMMENT '이전 잔액',
    new_balance VARCHAR(78) COMMENT '새 잔액',
    balance_change VARCHAR(78) COMMENT '변화량',
    change_percentage DECIMAL(10,4) COMMENT '변화율 (%)',
    
    -- 변화 유형
    change_type ENUM('increase', 'decrease', 'new_holder', 'exit_holder') NOT NULL,
    transaction_count INT DEFAULT 0 COMMENT '해당 일자 거래 횟수',
    
    -- 메타 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_token_address (token_address),
    INDEX idx_owner_address (owner_address),
    INDEX idx_change_date (change_date),
    INDEX idx_token_version (token_version),
    INDEX idx_change_type (change_type),
    
    UNIQUE KEY uk_holder_change (token_address, owner_address, change_date)
);

-- 4. HKTM v1/v2 마이그레이션 추적 테이블
CREATE TABLE IF NOT EXISTS hktm_migration_tracking (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 홀더 정보
    holder_address VARCHAR(42) NOT NULL,
    
    -- v1 정보
    v1_balance VARCHAR(78) COMMENT 'v1 보유량',
    v1_balance_formatted DECIMAL(36,18),
    v1_last_activity TIMESTAMP COMMENT 'v1 마지막 활동',
    
    -- v2 정보
    v2_balance VARCHAR(78) COMMENT 'v2 보유량',
    v2_balance_formatted DECIMAL(36,18),
    v2_first_activity TIMESTAMP COMMENT 'v2 첫 활동',
    
    -- 마이그레이션 상태
    migration_status ENUM('not_started', 'partial', 'completed', 'v1_only', 'v2_only') DEFAULT 'not_started',
    migration_percentage DECIMAL(5,2) COMMENT '마이그레이션 완료율',
    
    -- 분석 정보
    is_large_holder BOOLEAN DEFAULT FALSE COMMENT '대형 홀더 여부',
    holder_category ENUM('whale', 'large', 'medium', 'small', 'dust') COMMENT '홀더 분류',
    
    -- 메타 정보
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_holder_address (holder_address),
    INDEX idx_migration_status (migration_status),
    INDEX idx_holder_category (holder_category),
    INDEX idx_is_large_holder (is_large_holder),
    
    UNIQUE KEY uk_holder (holder_address)
);

-- 5. 토큰 일일 통계 테이블
CREATE TABLE IF NOT EXISTS token_daily_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 토큰 정보
    token_address VARCHAR(42) NOT NULL,
    token_version VARCHAR(10) COMMENT 'v1, v2',
    
    -- 날짜
    stats_date DATE NOT NULL,
    
    -- 홀더 통계
    total_holders INT DEFAULT 0,
    new_holders INT DEFAULT 0,
    exited_holders INT DEFAULT 0,
    active_holders INT DEFAULT 0 COMMENT '해당 일자 거래한 홀더 수',
    
    -- 잔액 통계
    total_supply VARCHAR(78),
    total_supply_formatted DECIMAL(36,18),
    circulating_supply VARCHAR(78) COMMENT '실제 유통량',
    circulating_supply_formatted DECIMAL(36,18),
    
    -- 거래 통계
    total_transactions INT DEFAULT 0,
    total_volume VARCHAR(78) DEFAULT '0',
    total_volume_formatted DECIMAL(36,18) DEFAULT 0,
    large_transactions INT DEFAULT 0 COMMENT '대량 거래 수',
    
    -- 집중도 통계
    top_10_percentage DECIMAL(5,2) COMMENT '상위 10명 집중도',
    top_50_percentage DECIMAL(5,2) COMMENT '상위 50명 집중도',
    top_100_percentage DECIMAL(5,2) COMMENT '상위 100명 집중도',
    
    -- 가격 정보 (있는 경우)
    token_price_usd DECIMAL(20,8),
    market_cap_usd DECIMAL(20,2),
    
    -- 메타 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_token_address (token_address),
    INDEX idx_stats_date (stats_date),
    INDEX idx_token_version (token_version),
    INDEX idx_total_holders (total_holders),
    
    UNIQUE KEY uk_token_daily (token_address, stats_date)
);

-- 초기 데이터 삽입: HKTM v1, v2 토큰 메타데이터
INSERT IGNORE INTO token_metadata (
    token_address, name, symbol, decimals, total_supply, total_supply_formatted, 
    verified_contract, chain_id, created_at
) VALUES 
(
    '0x6b604ed7f75ea6cd514b0b6a6709d6faca331a56',
    'HAKUTO METAVERSE TOKEN',
    'HKTM',
    4,
    '25000000000000',
    2500000000.0000,
    FALSE,
    'bsc',
    NOW()
),
(
    '0x3f36346f6389ab3253d0f4ebacde5c5dcd384a0b',
    'HAKUTO METAVERSE TOKEN',
    'HKTM',
    18,
    '2500000000000000000000000000',
    2500000000.000000000000000000,
    FALSE,
    'bsc',
    NOW()
);

-- 뷰 생성: HKTM 통합 홀더 현황
CREATE OR REPLACE VIEW hktm_combined_holders AS
SELECT 
    'v1' as token_version,
    token_address,
    owner_address,
    balance,
    balance_formatted,
    percentage_relative_to_total_supply,
    snapshot_date,
    created_at
FROM token_holders_snapshot 
WHERE token_address = '0x6b604ed7f75ea6cd514b0b6a6709d6faca331a56'

UNION ALL

SELECT 
    'v2' as token_version,
    token_address,
    owner_address,
    balance,
    balance_formatted,
    percentage_relative_to_total_supply,
    snapshot_date,
    created_at
FROM token_holders_snapshot 
WHERE token_address = '0x3f36346f6389ab3253d0f4ebacde5c5dcd384a0b';
