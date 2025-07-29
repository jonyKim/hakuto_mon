import * as admin from 'firebase-admin';

export interface FirebaseConfig {
    projectId: string;
    privateKey: string;
    clientEmail: string;
}

export interface PushNotificationData {
    title: string;
    body: string;
    data?: { [key: string]: string };
    imageUrl?: string;
}

export interface NotificationResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export class FirebaseService {
    private app: admin.app.App | null = null;
    private initialized = false;

    constructor(private config: FirebaseConfig) {}

    /**
     * Firebase Admin SDK 초기화
     */
    initialize(): void {
        if (this.initialized) {
            return;
        }

        try {
            // 서비스 계정 키 정보 설정
            const serviceAccount = {
                projectId: this.config.projectId,
                privateKey: this.config.privateKey.replace(/\\n/g, '\n'),
                clientEmail: this.config.clientEmail,
            };

            // Firebase Admin 초기화
            this.app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: this.config.projectId,
            });

            this.initialized = true;
            console.log('Firebase Admin SDK initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Firebase Admin SDK:', error);
            throw new Error('Firebase initialization failed');
        }
    }

    /**
     * 단일 디바이스에 푸시 알림 발송
     */
    async sendToDevice(
        fcmToken: string,
        notification: PushNotificationData
    ): Promise<NotificationResult> {
        if (!this.initialized || !this.app) {
            throw new Error('Firebase not initialized');
        }

        try {
            const message: admin.messaging.Message = {
                token: fcmToken,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    imageUrl: notification.imageUrl,
                },
                data: notification.data || {},
                android: {
                    notification: {
                        channelId: 'hakuto_notifications',
                        priority: 'high' as const,
                        defaultSound: true,
                        defaultVibrateTimings: true,
                    },
                    priority: 'high' as const,
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: notification.title,
                                body: notification.body,
                            },
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            };

            const response = await admin.messaging().send(message);

            return {
                success: true,
                messageId: response,
            };
        } catch (error: any) {
            console.error('Failed to send FCM message:', error);
            
            // Firebase 에러 코드별 처리
            let errorMessage = 'Unknown error occurred';
            if (error.code) {
                switch (error.code) {
                    case 'messaging/invalid-registration-token':
                    case 'messaging/registration-token-not-registered':
                        errorMessage = 'Invalid or unregistered FCM token';
                        break;
                    case 'messaging/message-rate-exceeded':
                        errorMessage = 'Message rate exceeded';
                        break;
                    case 'messaging/device-message-rate-exceeded':
                        errorMessage = 'Device message rate exceeded';
                        break;
                    case 'messaging/topics-message-rate-exceeded':
                        errorMessage = 'Topics message rate exceeded';
                        break;
                    default:
                        errorMessage = error.message || 'FCM send failed';
                }
            }

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * 여러 디바이스에 푸시 알림 발송
     */
    async sendToMultipleDevices(
        fcmTokens: string[],
        notification: PushNotificationData
    ): Promise<NotificationResult[]> {
        if (!this.initialized || !this.app) {
            throw new Error('Firebase not initialized');
        }

        try {
            const message: admin.messaging.MulticastMessage = {
                tokens: fcmTokens,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    imageUrl: notification.imageUrl,
                },
                data: notification.data || {},
                android: {
                    notification: {
                        channelId: 'hakuto_notifications',
                        priority: 'high' as const,
                        defaultSound: true,
                        defaultVibrateTimings: true,
                    },
                    priority: 'high' as const,
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: notification.title,
                                body: notification.body,
                            },
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            };

            const response = await admin.messaging().sendEachForMulticast(message);

            // 각 토큰별 결과 매핑
            const results: NotificationResult[] = response.responses.map((res, index) => {
                if (res.success) {
                    return {
                        success: true,
                        messageId: res.messageId,
                    };
                } else {
                    return {
                        success: false,
                        error: res.error?.message || 'Unknown error',
                    };
                }
            });

            return results;
        } catch (error: any) {
            console.error('Failed to send multicast FCM message:', error);
            
            // 모든 토큰에 대해 실패 결과 반환
            return fcmTokens.map(() => ({
                success: false,
                error: error.message || 'FCM multicast send failed',
            }));
        }
    }

    /**
     * 토픽에 푸시 알림 발송
     */
    async sendToTopic(
        topic: string,
        notification: PushNotificationData
    ): Promise<NotificationResult> {
        if (!this.initialized || !this.app) {
            throw new Error('Firebase not initialized');
        }

        try {
            const message: admin.messaging.Message = {
                topic: topic,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    imageUrl: notification.imageUrl,
                },
                data: notification.data || {},
                android: {
                    notification: {
                        channelId: 'hakuto_notifications',
                        priority: 'high' as const,
                        defaultSound: true,
                        defaultVibrateTimings: true,
                    },
                    priority: 'high' as const,
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: notification.title,
                                body: notification.body,
                            },
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            };

            const response = await admin.messaging().send(message);

            return {
                success: true,
                messageId: response,
            };
        } catch (error: any) {
            console.error('Failed to send topic FCM message:', error);
            
            return {
                success: false,
                error: error.message || 'FCM topic send failed',
            };
        }
    }

    /**
     * FCM 토큰 유효성 검증
     */
    async validateToken(fcmToken: string): Promise<boolean> {
        if (!this.initialized || !this.app) {
            throw new Error('Firebase not initialized');
        }

        try {
            // 빈 메시지로 토큰 유효성 검사
            const message: admin.messaging.Message = {
                token: fcmToken,
                data: { test: 'validation' },
            };

            // 실제로 발송하지 않고 유효성만 검사
            await admin.messaging().send(message, true); // dryRun = true
            return true;
        } catch (error: any) {
            console.warn('Invalid FCM token:', fcmToken, error.code);
            return false;
        }
    }

    /**
     * 토픽 구독
     */
    async subscribeToTopic(fcmTokens: string[], topic: string): Promise<void> {
        if (!this.initialized || !this.app) {
            throw new Error('Firebase not initialized');
        }

        try {
            await admin.messaging().subscribeToTopic(fcmTokens, topic);
            console.log(`Successfully subscribed ${fcmTokens.length} tokens to topic: ${topic}`);
        } catch (error) {
            console.error('Failed to subscribe to topic:', error);
            throw error;
        }
    }

    /**
     * 토픽 구독 해제
     */
    async unsubscribeFromTopic(fcmTokens: string[], topic: string): Promise<void> {
        if (!this.initialized || !this.app) {
            throw new Error('Firebase not initialized');
        }

        try {
            await admin.messaging().unsubscribeFromTopic(fcmTokens, topic);
            console.log(`Successfully unsubscribed ${fcmTokens.length} tokens from topic: ${topic}`);
        } catch (error) {
            console.error('Failed to unsubscribe from topic:', error);
            throw error;
        }
    }

    /**
     * Firebase 서비스 종료
     */
    async shutdown(): Promise<void> {
        if (this.app) {
            await this.app.delete();
            this.app = null;
            this.initialized = false;
            console.log('Firebase Admin SDK shutdown');
        }
    }
} 