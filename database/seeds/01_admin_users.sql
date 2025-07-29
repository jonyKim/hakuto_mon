-- Admin Users 초기 데이터
-- 기본 관리자 계정 생성

INSERT INTO `admin_users` (
    `uuid_admin`, 
    `name`, 
    `email_id`, 
    `admin_password`, 
    `admin_grade`
) VALUES 
(
    UUID(), 
    '시스템 관리자', 
    'admin@hakuto.io', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    'admin'
),
(
    UUID(), 
    '테스트 사용자', 
    'test@hakuto.io', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    'user'
) ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`),
    `admin_grade` = VALUES(`admin_grade`),
    `updated_at` = CURRENT_TIMESTAMP(6); 