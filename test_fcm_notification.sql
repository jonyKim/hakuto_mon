-- FCM 푸시 알림 테스트를 위한 테스트 사용자 생성 및 조회

-- 1. 기존 테스트 사용자 확인
SELECT * FROM wallet_users WHERE email LIKE '%test%' OR wallet_address LIKE '%test%';

-- 2. 테스트 사용자 생성 (FCM 토큰 포함)
INSERT INTO wallet_users (
    id,
    wallet_address, 
    email,
    email_verified,
    fcm_token,
    created_at,
    updated_at
) VALUES (
    'test-user-fcm-001',
    '0xTestWalletAddressForFCM001',
    'test.fcm@hakuto.io',
    1,
    'test_fcm_token_for_notification_testing_001',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE
    fcm_token = 'test_fcm_token_for_notification_testing_001',
    updated_at = NOW();

-- 3. 생성된 테스트 사용자 확인
SELECT 
    id,
    wallet_address,
    email,
    email_verified,
    fcm_token,
    created_at
FROM wallet_users 
WHERE id = 'test-user-fcm-001';

-- 4. 이벤트 알림 대상 사용자 조회 (Event Alert 범위별)
-- all_projects: 모든 사용자
SELECT COUNT(*) as total_users FROM wallet_users WHERE fcm_token IS NOT NULL AND fcm_token != '';

-- hakuto_token: HKTM 보유 사용자 (예시)
-- SELECT COUNT(*) as hktm_holders FROM wallet_users WHERE id IN (
--     SELECT DISTINCT user_id FROM user_assets WHERE symbol = 'HKTM' AND balance > 0
-- );

-- 5. 알림 발송 테스트를 위한 이벤트 조회
SELECT 
    id,
    title,
    description,
    scope,
    status,
    created_at
FROM events 
WHERE status = 'active' OR status = 'upcoming'
ORDER BY created_at DESC
LIMIT 5;
