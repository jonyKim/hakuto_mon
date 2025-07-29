-- System Settings 초기 데이터
-- 기본 시스템 설정값 생성

INSERT INTO `system_settings` (
    `id`,
    `key`, 
    `value`, 
    `description`, 
    `type`
) VALUES 
-- Firebase FCM 설정
(
    UUID(),
    'fcm.server_key', 
    '', 
    'Firebase FCM 서버 키', 
    'string'
),
(
    UUID(),
    'fcm.project_id', 
    '', 
    'Firebase 프로젝트 ID', 
    'string'
),

-- 이메일 설정
(
    UUID(),
    'email.smtp_host', 
    'smtp.gmail.com', 
    'SMTP 서버 호스트', 
    'string'
),
(
    UUID(),
    'email.smtp_port', 
    '587', 
    'SMTP 서버 포트', 
    'number'
),
(
    UUID(),
    'email.smtp_secure', 
    'false', 
    'SMTP 보안 연결 사용', 
    'boolean'
),
(
    UUID(),
    'email.from_address', 
    'noreply@hakuto.io', 
    '발신자 이메일 주소', 
    'string'
),
(
    UUID(),
    'email.from_name', 
    'HAKUTO MON', 
    '발신자 이름', 
    'string'
),

-- 알림 설정
(
    UUID(),
    'notification.email_verification_expires_minutes', 
    '10', 
    '이메일 인증 만료 시간 (분)', 
    'number'
),
(
    UUID(),
    'notification.max_daily_notifications', 
    '50', 
    '일일 최대 알림 수', 
    'number'
),
(
    UUID(),
    'notification.price_alert_cooldown_minutes', 
    '60', 
    '가격 알림 쿨다운 시간 (분)', 
    'number'
),

-- 가격 모니터링 설정
(
    UUID(),
    'price.update_interval_seconds', 
    '30', 
    '가격 업데이트 주기 (초)', 
    'number'
),
(
    UUID(),
    'price.supported_symbols', 
    '["HKTM", "BTC", "ETH", "BNB"]', 
    '지원하는 심볼 목록', 
    'json'
),
(
    UUID(),
    'price.mexc_api_url', 
    'https://api.mexc.com/api/v3/ticker/24hr', 
    'MEXC API URL', 
    'string'
),

-- 보안 설정
(
    UUID(),
    'security.max_verification_attempts', 
    '5', 
    '최대 인증 시도 횟수', 
    'number'
),
(
    UUID(),
    'security.verification_block_hours', 
    '24', 
    '인증 실패시 차단 시간 (시간)', 
    'number'
),

-- 관리자 설정
(
    UUID(),
    'admin.pagination_default_limit', 
    '20', 
    '기본 페이지네이션 개수', 
    'number'
),
(
    UUID(),
    'admin.log_retention_days', 
    '90', 
    '로그 보관 기간 (일)', 
    'number'
)
ON DUPLICATE KEY UPDATE 
    `description` = VALUES(`description`),
    `type` = VALUES(`type`),
    `updated_at` = CURRENT_TIMESTAMP(6); 