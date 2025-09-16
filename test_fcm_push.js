/**
 * FCM 푸시 알림 테스트 스크립트
 * 
 * 사용법:
 * 1. EC2 서버에서 실행: node test_fcm_push.js
 * 2. 실제 FCM 토큰으로 테스트하려면 FCM_TOKEN 환경변수 설정
 * 
 * 테스트 항목:
 * - Firebase 초기화 확인
 * - FCM 토큰 유효성 검증
 * - 단일 디바이스 푸시 알림 발송
 * - 이벤트 알림 시뮬레이션
 */

require('dotenv').config();
const { FirebaseService } = require('./api/dist/application/firebase.service');
const { NotificationService } = require('./api/dist/application/notification.service');

// Firebase 설정
const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
};

// 테스트용 FCM 토큰 (실제 디바이스 토큰으로 교체 필요)
const TEST_FCM_TOKEN = process.env.FCM_TOKEN || 'test_fcm_token_for_notification_testing_001';

async function testFirebaseInitialization() {
    console.log('🔥 Firebase 초기화 테스트...');
    
    try {
        const firebaseService = new FirebaseService(firebaseConfig);
        firebaseService.initialize();
        console.log('✅ Firebase 초기화 성공');
        return firebaseService;
    } catch (error) {
        console.error('❌ Firebase 초기화 실패:', error.message);
        return null;
    }
}

async function testFCMTokenValidation(firebaseService, fcmToken) {
    console.log('🔍 FCM 토큰 유효성 검증...');
    
    try {
        const isValid = await firebaseService.validateToken(fcmToken);
        if (isValid) {
            console.log('✅ FCM 토큰 유효함');
        } else {
            console.log('⚠️ FCM 토큰 무효함 (테스트용 더미 토큰)');
        }
        return isValid;
    } catch (error) {
        console.error('❌ FCM 토큰 검증 실패:', error.message);
        return false;
    }
}

async function testSingleDeviceNotification(firebaseService, fcmToken) {
    console.log('📱 단일 디바이스 푸시 알림 테스트...');
    
    const notification = {
        title: '🚀 HAKUTO MON 테스트 알림',
        body: 'FCM 푸시 알림이 정상적으로 작동하고 있습니다!',
        data: {
            type: 'test',
            timestamp: new Date().toISOString(),
            source: 'fcm_test_script'
        },
        imageUrl: 'https://via.placeholder.com/512x256/667eea/ffffff?text=HAKUTO+MON'
    };
    
    try {
        const result = await firebaseService.sendToDevice(fcmToken, notification);
        
        if (result.success) {
            console.log('✅ 푸시 알림 발송 성공');
            console.log('📨 메시지 ID:', result.messageId);
        } else {
            console.log('⚠️ 푸시 알림 발송 실패:', result.error);
        }
        
        return result;
    } catch (error) {
        console.error('❌ 푸시 알림 발송 중 오류:', error.message);
        return { success: false, error: error.message };
    }
}

async function testEventNotificationSimulation(firebaseService, fcmToken) {
    console.log('🎉 이벤트 알림 시뮬레이션...');
    
    const eventNotification = {
        title: '🎯 새로운 이벤트 발표!',
        body: 'HAKUTO 토큰 스테이킹 이벤트가 시작되었습니다. 지금 참여하세요!',
        data: {
            type: 'event',
            eventId: 'test-event-001',
            eventType: 'staking_event',
            scope: 'hakuto_token',
            priority: 'high',
            actionUrl: 'hakuto://events/test-event-001'
        },
        imageUrl: 'https://via.placeholder.com/512x256/764ba2/ffffff?text=STAKING+EVENT'
    };
    
    try {
        const result = await firebaseService.sendToDevice(fcmToken, eventNotification);
        
        if (result.success) {
            console.log('✅ 이벤트 알림 발송 성공');
            console.log('📨 메시지 ID:', result.messageId);
        } else {
            console.log('⚠️ 이벤트 알림 발송 실패:', result.error);
        }
        
        return result;
    } catch (error) {
        console.error('❌ 이벤트 알림 발송 중 오류:', error.message);
        return { success: false, error: error.message };
    }
}

async function testTopicNotification(firebaseService) {
    console.log('📢 토픽 알림 테스트...');
    
    const topicNotification = {
        title: '📈 HKTM 가격 알림',
        body: 'HKTM 가격이 목표가에 도달했습니다! 현재 가격: $0.00102',
        data: {
            type: 'price_alert',
            symbol: 'HKTM',
            price: '0.00102',
            change: '-1.92%',
            alertType: 'target_reached'
        }
    };
    
    try {
        const result = await firebaseService.sendToTopic('hktm_price_alerts', topicNotification);
        
        if (result.success) {
            console.log('✅ 토픽 알림 발송 성공');
            console.log('📨 메시지 ID:', result.messageId);
        } else {
            console.log('⚠️ 토픽 알림 발송 실패:', result.error);
        }
        
        return result;
    } catch (error) {
        console.error('❌ 토픽 알림 발송 중 오류:', error.message);
        return { success: false, error: error.message };
    }
}

async function runFCMTests() {
    console.log('🧪 FCM 푸시 알림 테스트 시작\n');
    console.log('📋 테스트 환경:');
    console.log(`   - Firebase Project ID: ${firebaseConfig.projectId}`);
    console.log(`   - FCM Token: ${TEST_FCM_TOKEN.substring(0, 20)}...`);
    console.log(`   - 테스트 시간: ${new Date().toLocaleString()}\n`);
    
    // 1. Firebase 초기화
    const firebaseService = await testFirebaseInitialization();
    if (!firebaseService) {
        console.log('❌ Firebase 초기화 실패로 테스트 중단');
        return;
    }
    
    console.log('');
    
    // 2. FCM 토큰 유효성 검증
    const isValidToken = await testFCMTokenValidation(firebaseService, TEST_FCM_TOKEN);
    console.log('');
    
    // 3. 단일 디바이스 알림 테스트
    await testSingleDeviceNotification(firebaseService, TEST_FCM_TOKEN);
    console.log('');
    
    // 4. 이벤트 알림 시뮬레이션
    await testEventNotificationSimulation(firebaseService, TEST_FCM_TOKEN);
    console.log('');
    
    // 5. 토픽 알림 테스트
    await testTopicNotification(firebaseService);
    console.log('');
    
    // 6. Firebase 종료
    await firebaseService.shutdown();
    console.log('🔥 Firebase 서비스 종료');
    
    console.log('\n✅ FCM 테스트 완료!');
    console.log('\n📱 실제 디바이스에서 알림을 확인하세요:');
    console.log('   1. 모바일 앱이 설치되어 있는지 확인');
    console.log('   2. FCM 토큰이 올바르게 등록되어 있는지 확인');
    console.log('   3. 알림 권한이 허용되어 있는지 확인');
    console.log('   4. 백그라운드/포그라운드 상태에서 모두 테스트');
}

// 스크립트 실행
if (require.main === module) {
    runFCMTests().catch(error => {
        console.error('❌ 테스트 실행 중 오류:', error);
        process.exit(1);
    });
}

module.exports = {
    runFCMTests,
    testFirebaseInitialization,
    testFCMTokenValidation,
    testSingleDeviceNotification,
    testEventNotificationSimulation,
    testTopicNotification
};
