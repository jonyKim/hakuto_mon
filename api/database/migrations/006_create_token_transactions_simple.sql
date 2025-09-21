-- =====================================================
-- 006: 토큰 트랜잭션 테이블 생성 (단순 버전)
-- =====================================================

-- 토큰 트랜잭션 원시 데이터 테이블
CREATE TABLE IF NOT EXISTS token_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 트랜잭션 기본 정보
    transaction_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    unix_timestamp BIGINT NOT NULL,
    datetime_utc DATETIME NOT NULL,
    
    -- 토큰 정보
    token_address VARCHAR(42) NOT NULL,
    token_name VARCHAR(100),
    token_symbol VARCHAR(20),
    token_version VARCHAR(10),
    
    -- 전송 정보
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    quantity_raw VARCHAR(50) NOT NULL, -- 원시 문자열 (쉼표 포함)
    quantity_numeric DECIMAL(40,18) NOT NULL, -- 숫자 변환값
    method VARCHAR(50) NOT NULL,
    
    -- 메타데이터
    is_mint BOOLEAN DEFAULT FALSE,
    is_burn BOOLEAN DEFAULT FALSE,
    is_transfer BOOLEAN DEFAULT TRUE,
    is_swap BOOLEAN DEFAULT FALSE,
    
    -- 인덱싱 및 추적
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_token_address (token_address),
    INDEX idx_transaction_hash (transaction_hash),
    INDEX idx_block_number (block_number),
    INDEX idx_from_address (from_address),
    INDEX idx_to_address (to_address),
    INDEX idx_datetime_utc (datetime_utc),
    INDEX idx_token_method (token_address, method),
    INDEX idx_token_block (token_address, block_number),
    
    -- 유니크 제약조건
    UNIQUE KEY unique_transaction (transaction_hash, token_address, from_address, to_address)
);

-- 토큰 홀더 잔액 실시간 추적 테이블 (트랜잭션 기반 계산)
CREATE TABLE IF NOT EXISTS token_holders_realtime (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 토큰 및 홀더 정보
    token_address VARCHAR(42) NOT NULL,
    token_name VARCHAR(100),
    token_symbol VARCHAR(20),
    token_version VARCHAR(10),
    holder_address VARCHAR(42) NOT NULL,
    
    -- 잔액 정보
    balance_raw DECIMAL(40,18) NOT NULL DEFAULT 0,
    balance_formatted DECIMAL(20,8) NOT NULL DEFAULT 0,
    percentage_of_supply DECIMAL(10,6) DEFAULT 0,
    
    -- 홀더 활동 정보
    first_acquisition_block BIGINT,
    first_acquisition_datetime DATETIME,
    last_activity_block BIGINT,
    last_activity_datetime DATETIME,
    total_received DECIMAL(40,18) DEFAULT 0,
    total_sent DECIMAL(40,18) DEFAULT 0,
    transaction_count INT DEFAULT 0,
    
    -- 홀더 분류
    holder_rank INT DEFAULT 0,
    holder_category ENUM('whale', 'large', 'medium', 'small', 'dust') DEFAULT 'small',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 메타데이터
    last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_token_holder (token_address, holder_address),
    INDEX idx_token_balance (token_address, balance_formatted DESC),
    INDEX idx_holder_category (token_address, holder_category),
    INDEX idx_active_holders (token_address, is_active),
    INDEX idx_last_activity (last_activity_datetime),
    
    -- 유니크 제약조건
    UNIQUE KEY unique_token_holder (token_address, holder_address)
);

-- 토큰 일별 통계 테이블
CREATE TABLE IF NOT EXISTS token_daily_statistics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 토큰 및 날짜 정보
    token_address VARCHAR(42) NOT NULL,
    token_name VARCHAR(100),
    token_symbol VARCHAR(20),
    token_version VARCHAR(10),
    date DATE NOT NULL,
    
    -- 홀더 통계
    total_holders INT DEFAULT 0,
    active_holders INT DEFAULT 0,
    new_holders INT DEFAULT 0,
    whale_holders INT DEFAULT 0,
    large_holders INT DEFAULT 0,
    medium_holders INT DEFAULT 0,
    small_holders INT DEFAULT 0,
    
    -- 거래 통계
    total_transactions INT DEFAULT 0,
    total_volume DECIMAL(40,18) DEFAULT 0,
    total_volume_formatted DECIMAL(20,8) DEFAULT 0,
    unique_senders INT DEFAULT 0,
    unique_receivers INT DEFAULT 0,
    
    -- 토큰 분포 통계
    top_10_percentage DECIMAL(10,6) DEFAULT 0,
    top_50_percentage DECIMAL(10,6) DEFAULT 0,
    top_100_percentage DECIMAL(10,6) DEFAULT 0,
    gini_coefficient DECIMAL(8,6) DEFAULT 0,
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_token_date (token_address, date),
    INDEX idx_date (date),
    
    -- 유니크 제약조건
    UNIQUE KEY unique_token_date (token_address, date)
);

-- 토큰 공급량 추적 테이블
CREATE TABLE IF NOT EXISTS token_supply_tracking (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 토큰 정보
    token_address VARCHAR(42) NOT NULL,
    token_name VARCHAR(100),
    token_symbol VARCHAR(20),
    token_version VARCHAR(10),
    
    -- 공급량 정보
    total_supply DECIMAL(40,18) NOT NULL DEFAULT 0,
    total_supply_formatted DECIMAL(20,8) NOT NULL DEFAULT 0,
    circulating_supply DECIMAL(40,18) NOT NULL DEFAULT 0,
    circulating_supply_formatted DECIMAL(20,8) NOT NULL DEFAULT 0,
    
    -- 민트/번 추적
    total_minted DECIMAL(40,18) DEFAULT 0,
    total_burned DECIMAL(40,18) DEFAULT 0,
    mint_transactions INT DEFAULT 0,
    burn_transactions INT DEFAULT 0,
    
    -- 블록 정보
    last_updated_block BIGINT NOT NULL,
    last_updated_datetime DATETIME NOT NULL,
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_token_address (token_address),
    INDEX idx_last_updated (last_updated_datetime),
    
    -- 유니크 제약조건
    UNIQUE KEY unique_token (token_address)
);
