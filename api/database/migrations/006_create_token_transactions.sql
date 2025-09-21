-- =====================================================
-- 006: 토큰 트랜잭션 테이블 생성
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

-- 트리거: 토큰 트랜잭션 삽입 시 홀더 잔액 자동 업데이트
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS update_holder_balance_after_transaction
AFTER INSERT ON token_transactions
FOR EACH ROW
BEGIN
    -- FROM 주소 잔액 차감 (민트가 아닌 경우)
    IF NEW.from_address != '0x0000000000000000000000000000000000000000' THEN
        INSERT INTO token_holders_realtime (
            token_address, token_name, token_symbol, token_version, holder_address,
            balance_raw, total_sent, transaction_count, last_activity_block, last_activity_datetime
        ) VALUES (
            NEW.token_address, NEW.token_name, NEW.token_symbol, NEW.token_version, NEW.from_address,
            -NEW.quantity_numeric, NEW.quantity_numeric, 1, NEW.block_number, NEW.datetime_utc
        )
        ON DUPLICATE KEY UPDATE
            balance_raw = balance_raw - NEW.quantity_numeric,
            total_sent = total_sent + NEW.quantity_numeric,
            transaction_count = transaction_count + 1,
            last_activity_block = NEW.block_number,
            last_activity_datetime = NEW.datetime_utc,
            is_active = (balance_raw - NEW.quantity_numeric > 0),
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- TO 주소 잔액 증가 (번이 아닌 경우)
    IF NEW.to_address != '0x0000000000000000000000000000000000000000' THEN
        INSERT INTO token_holders_realtime (
            token_address, token_name, token_symbol, token_version, holder_address,
            balance_raw, total_received, transaction_count, 
            first_acquisition_block, first_acquisition_datetime,
            last_activity_block, last_activity_datetime
        ) VALUES (
            NEW.token_address, NEW.token_name, NEW.token_symbol, NEW.token_version, NEW.to_address,
            NEW.quantity_numeric, NEW.quantity_numeric, 1,
            NEW.block_number, NEW.datetime_utc,
            NEW.block_number, NEW.datetime_utc
        )
        ON DUPLICATE KEY UPDATE
            balance_raw = balance_raw + NEW.quantity_numeric,
            total_received = total_received + NEW.quantity_numeric,
            transaction_count = transaction_count + 1,
            last_activity_block = NEW.block_number,
            last_activity_datetime = NEW.datetime_utc,
            is_active = TRUE,
            updated_at = CURRENT_TIMESTAMP,
            first_acquisition_block = COALESCE(first_acquisition_block, NEW.block_number),
            first_acquisition_datetime = COALESCE(first_acquisition_datetime, NEW.datetime_utc);
    END IF;
END$$

DELIMITER ;

-- 초기 데이터 확인용 뷰
CREATE OR REPLACE VIEW v_token_holder_summary AS
SELECT 
    t.token_address,
    t.token_name,
    t.token_symbol,
    t.token_version,
    COUNT(*) as total_holders,
    COUNT(CASE WHEN t.is_active = TRUE THEN 1 END) as active_holders,
    SUM(t.balance_formatted) as total_balance,
    MAX(t.balance_formatted) as max_balance,
    AVG(t.balance_formatted) as avg_balance,
    MAX(t.last_activity_datetime) as latest_activity
FROM token_holders_realtime t
WHERE t.balance_raw > 0
GROUP BY t.token_address, t.token_name, t.token_symbol, t.token_version;

-- 인덱스 최적화
ANALYZE TABLE token_transactions;
ANALYZE TABLE token_holders_realtime;
ANALYZE TABLE token_daily_statistics;
ANALYZE TABLE token_supply_tracking;
