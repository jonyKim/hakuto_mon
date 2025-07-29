-- HAKUTO MON Service Database Schema
-- Database: THEMOON_MON_SERVICE

-- 1. Admin Users Table (기존 테이블)
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid_admin` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email_id` varchar(100) NOT NULL,
  `admin_password` varchar(255) NOT NULL,
  `admin_grade` varchar(50) NOT NULL DEFAULT 'user',
  `lastlogin_ip` varchar(45) DEFAULT NULL,
  `remember_token` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_admin_users_uuid_admin` (`uuid_admin`),
  UNIQUE KEY `UQ_admin_users_email_id` (`email_id`),
  KEY `IDX_admin_users_admin_grade` (`admin_grade`),
  KEY `IDX_admin_users_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Wallet Users Table (신규 테이블)
CREATE TABLE IF NOT EXISTS `wallet_users` (
  `id` varchar(36) NOT NULL,
  `wallet_address` varchar(42) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `fcm_token` text DEFAULT NULL,
  `verification_token` varchar(6) DEFAULT NULL,
  `verification_expires_at` datetime DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_wallet_users_wallet_address` (`wallet_address`),
  UNIQUE KEY `UQ_wallet_users_email` (`email`),
  KEY `IDX_wallet_users_verification_token` (`verification_token`),
  KEY `IDX_wallet_users_email_verified` (`email_verified`),
  KEY `IDX_wallet_users_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Asset Prices Table (가격 정보 저장)
CREATE TABLE IF NOT EXISTS `asset_prices` (
  `id` varchar(36) NOT NULL,
  `symbol` varchar(20) NOT NULL,
  `price_usd` decimal(20,8) NOT NULL,
  `price_change_24h` decimal(10,4) DEFAULT NULL,
  `volume_24h` decimal(20,2) DEFAULT NULL,
  `market_cap` decimal(20,2) DEFAULT NULL,
  `exchange` varchar(50) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_asset_prices_symbol` (`symbol`),
  KEY `IDX_asset_prices_exchange` (`exchange`),
  KEY `IDX_asset_prices_created_at` (`created_at`),
  UNIQUE KEY `UQ_asset_prices_symbol_exchange_created` (`symbol`, `exchange`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Price Alerts Table (가격 알림 설정)
CREATE TABLE IF NOT EXISTS `price_alerts` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `symbol` varchar(20) NOT NULL,
  `alert_type` enum('above', 'below', 'change_percent') NOT NULL,
  `target_price` decimal(20,8) DEFAULT NULL,
  `change_percent` decimal(5,2) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_triggered` tinyint(1) NOT NULL DEFAULT 0,
  `triggered_at` datetime DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_price_alerts_user_id` (`user_id`),
  KEY `IDX_price_alerts_symbol` (`symbol`),
  KEY `IDX_price_alerts_is_active` (`is_active`),
  KEY `IDX_price_alerts_alert_type` (`alert_type`),
  FOREIGN KEY (`user_id`) REFERENCES `wallet_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Notification Logs Table (알림 기록)
CREATE TABLE IF NOT EXISTS `notification_logs` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `type` enum('email', 'fcm', 'sms') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` enum('pending', 'sent', 'failed', 'delivered') NOT NULL DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_notification_logs_user_id` (`user_id`),
  KEY `IDX_notification_logs_type` (`type`),
  KEY `IDX_notification_logs_status` (`status`),
  KEY `IDX_notification_logs_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `wallet_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Email Verification Attempts Table (이메일 인증 시도 기록)
CREATE TABLE IF NOT EXISTS `email_verification_attempts` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `verification_code` varchar(6) NOT NULL,
  `attempts_count` int(11) NOT NULL DEFAULT 0,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `expires_at` datetime NOT NULL,
  `verified_at` datetime DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_email_verification_user_id` (`user_id`),
  KEY `IDX_email_verification_email` (`email`),
  KEY `IDX_email_verification_code` (`verification_code`),
  KEY `IDX_email_verification_expires_at` (`expires_at`),
  FOREIGN KEY (`user_id`) REFERENCES `wallet_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. System Settings Table (시스템 설정)
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` varchar(36) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `type` enum('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_system_settings_key` (`key`),
  KEY `IDX_system_settings_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 