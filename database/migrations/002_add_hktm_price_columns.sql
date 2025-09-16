-- HKTM 가격 수집을 위한 asset_prices 테이블 컬럼 추가
-- Database: THEMOON_MON_SERVICE

-- asset_prices 테이블에 MEXC API에서 제공하는 추가 데이터 컬럼들 추가
ALTER TABLE `asset_prices` 
ADD COLUMN `price_change_percent_24h` decimal(10,4) DEFAULT NULL COMMENT '24시간 가격 변동률 (%)' AFTER `price_change_24h`,
ADD COLUMN `high_24h` decimal(20,8) DEFAULT NULL COMMENT '24시간 최고가' AFTER `price_change_percent_24h`,
ADD COLUMN `low_24h` decimal(20,8) DEFAULT NULL COMMENT '24시간 최저가' AFTER `high_24h`,
ADD COLUMN `open_price` decimal(20,8) DEFAULT NULL COMMENT '시가' AFTER `low_24h`,
ADD COLUMN `close_price` decimal(20,8) DEFAULT NULL COMMENT '종가' AFTER `open_price`,
ADD COLUMN `weighted_avg_price` decimal(20,8) DEFAULT NULL COMMENT '가중평균가격' AFTER `close_price`,
ADD COLUMN `bid_price` decimal(20,8) DEFAULT NULL COMMENT '매수호가' AFTER `weighted_avg_price`,
ADD COLUMN `ask_price` decimal(20,8) DEFAULT NULL COMMENT '매도호가' AFTER `bid_price`,
ADD COLUMN `last_updated_at` datetime DEFAULT NULL COMMENT '마지막 업데이트 시간' AFTER `ask_price`;

-- 인덱스 추가 (성능 최적화)
ALTER TABLE `asset_prices` 
ADD INDEX `IDX_asset_prices_symbol_created_at` (`symbol`, `created_at`),
ADD INDEX `IDX_asset_prices_last_updated_at` (`last_updated_at`);

-- HKTM 초기 데이터 삽입 (선택사항)
-- INSERT INTO `asset_prices` (
--     `id`, `symbol`, `price_usd`, `exchange`, `created_at`, `updated_at`
-- ) VALUES (
--     UUID(), 'HKTM', 0.00000000, 'MEXC', NOW(), NOW()
-- ) ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- 시스템 설정에 HKTM 관련 설정 추가
INSERT INTO `system_settings` (`id`, `key`, `value`, `description`, `type`, `is_active`) VALUES
(UUID(), 'hktm_price_collection_enabled', 'true', 'HKTM 가격 수집 활성화 여부', 'boolean', 1),
(UUID(), 'hktm_price_collection_interval', '60', 'HKTM 가격 수집 간격 (초)', 'number', 1),
(UUID(), 'hktm_mexc_symbol', 'HKTMUSDT', 'MEXC에서 사용하는 HKTM 심볼', 'string', 1),
(UUID(), 'hktm_price_alert_enabled', 'true', 'HKTM 가격 알림 활성화 여부', 'boolean', 1),
(UUID(), 'hktm_price_data_retention_days', '30', 'HKTM 가격 데이터 보관 기간 (일)', 'number', 1)
ON DUPLICATE KEY UPDATE `updated_at` = NOW();
