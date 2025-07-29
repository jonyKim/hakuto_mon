import { FirebaseService, PushNotificationData, NotificationResult } from './firebase.service';
import { EmailService } from './email.service';
import { NotificationLogRepository } from '../infrastructure/repositories/notification_log.repository';
import { WalletUserRepository } from '../infrastructure/repositories/wallet_user.repository';
import { NotificationType, NotificationStatus } from '../domain/entities/notification_log.entity';

export interface NotificationOptions {
    userId: string;
    title: string;
    message: string;
    data?: { [key: string]: string };
    imageUrl?: string;
    preferredType?: NotificationType;
}

export interface NotificationServiceResult {
    success: boolean;
    message: string;
    results?: {
        fcm?: NotificationResult;
        email?: boolean;
    };
}

export class NotificationService {
    private firebaseService: FirebaseService;
    private emailService: EmailService;
    private notificationLogRepository: NotificationLogRepository;
    private walletUserRepository: WalletUserRepository;

    constructor(
        firebaseService: FirebaseService,
        emailService: EmailService,
        notificationLogRepository: NotificationLogRepository,
        walletUserRepository: WalletUserRepository
    ) {
        this.firebaseService = firebaseService;
        this.emailService = emailService;
        this.notificationLogRepository = notificationLogRepository;
        this.walletUserRepository = walletUserRepository;
    }

    /**
     * 사용자에게 알림 발송 (FCM 우선, 이메일 백업)
     */
    async sendNotification(options: NotificationOptions): Promise<NotificationServiceResult> {
        try {
            // 사용자 정보 조회
            const user = await this.walletUserRepository.findById(options.userId);
            if (!user) {
                return {
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                };
            }

            const results: any = {};
            let fcmSuccess = false;
            let emailSuccess = false;

            // FCM 토큰이 있고 FCM을 우선 또는 기본으로 사용하는 경우
            if (user.fcmToken && options.preferredType !== NotificationType.EMAIL) {
                await this.createNotificationLog(
                    options.userId,
                    NotificationType.FCM,
                    options.title,
                    options.message,
                    { fcmToken: user.fcmToken, ...options.data }
                );

                const fcmResult = await this.sendFCMNotification(user.fcmToken, {
                    title: options.title,
                    body: options.message,
                    data: options.data,
                    imageUrl: options.imageUrl
                });

                results.fcm = fcmResult;
                fcmSuccess = fcmResult.success;

                // FCM 결과 로깅
                if (fcmResult.success) {
                    console.log(`FCM notification sent successfully to user ${options.userId}`);
                } else {
                    console.warn(`FCM notification failed for user ${options.userId}:`, fcmResult.error);
                }
            }

            // 이메일 인증된 사용자이고 (FCM 실패 시 백업 또는 이메일 우선인 경우)
            if (user.email && user.emailVerified && 
                (!fcmSuccess || options.preferredType === NotificationType.EMAIL)) {
                
                await this.createNotificationLog(
                    options.userId,
                    NotificationType.EMAIL,
                    options.title,
                    options.message,
                    { email: user.email, ...options.data }
                );

                emailSuccess = await this.sendEmailNotification(
                    user.email,
                    options.title,
                    options.message
                );

                results.email = emailSuccess;

                if (emailSuccess) {
                    console.log(`Email notification sent successfully to user ${options.userId}`);
                } else {
                    console.warn(`Email notification failed for user ${options.userId}`);
                }
            }

            // 결과 평가
            if (fcmSuccess || emailSuccess) {
                return {
                    success: true,
                    message: '알림이 성공적으로 발송되었습니다.',
                    results
                };
            } else {
                return {
                    success: false,
                    message: '알림 발송에 실패했습니다. FCM 토큰이나 이메일을 확인해주세요.',
                    results
                };
            }

        } catch (error) {
            console.error('Error sending notification:', error);
            return {
                success: false,
                message: '알림 발송 중 오류가 발생했습니다.'
            };
        }
    }

    /**
     * 여러 사용자에게 동시 알림 발송
     */
    async sendBulkNotification(
        userIds: string[],
        notification: Omit<NotificationOptions, 'userId'>
    ): Promise<NotificationServiceResult[]> {
        const results: NotificationServiceResult[] = [];

        for (const userId of userIds) {
            const result = await this.sendNotification({
                ...notification,
                userId
            });
            results.push(result);
        }

        return results;
    }

    /**
     * FCM 토큰으로 직접 알림 발송
     */
    async sendFCMNotification(
        fcmToken: string,
        notification: PushNotificationData
    ): Promise<NotificationResult> {
        try {
            return await this.firebaseService.sendToDevice(fcmToken, notification);
        } catch (error) {
            console.error('FCM notification error:', error);
            return {
                success: false,
                error: 'FCM 발송 실패'
            };
        }
    }

    /**
     * 이메일로 직접 알림 발송
     */
    async sendEmailNotification(
        email: string,
        title: string,
        message: string
    ): Promise<boolean> {
        try {
            // 간단한 알림 이메일 템플릿
            return await this.emailService.sendEmail(email, {
                subject: title,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                            <h1>🚀 HAKUTO MON</h1>
                            <h2>${title}</h2>
                        </div>
                        <div style="padding: 30px; background: #f9f9f9;">
                            <p style="font-size: 16px; line-height: 1.6;">${message}</p>
                        </div>
                        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                            © 2025 HAKUTO MON. All rights reserved.
                        </div>
                    </div>
                `,
                text: `${title}\n\n${message}\n\n© 2025 HAKUTO MON`
            });
        } catch (error) {
            console.error('Email notification error:', error);
            return false;
        }
    }

    /**
     * 토픽 구독자들에게 알림 발송
     */
    async sendTopicNotification(
        topic: string,
        notification: PushNotificationData
    ): Promise<NotificationResult> {
        try {
            const result = await this.firebaseService.sendToTopic(topic, notification);
            
            // 토픽 알림은 개별 사용자 로그가 아닌 시스템 로그로 처리
            await this.createSystemNotificationLog(
                NotificationType.FCM,
                notification.title,
                notification.body,
                { topic, ...notification.data }
            );

            return result;
        } catch (error) {
            console.error('Topic notification error:', error);
            return {
                success: false,
                error: '토픽 알림 발송 실패'
            };
        }
    }

    /**
     * FCM 토큰 유효성 검증 및 업데이트
     */
    async validateAndUpdateFCMToken(userId: string, fcmToken: string): Promise<boolean> {
        try {
            const isValid = await this.firebaseService.validateToken(fcmToken);
            
            if (isValid) {
                // 유효한 토큰인 경우 사용자 정보 업데이트
                await this.walletUserRepository.updateFcmToken(userId, fcmToken);
                return true;
            } else {
                // 유효하지 않은 토큰인 경우 제거
                await this.walletUserRepository.updateFcmToken(userId, '');
                return false;
            }
        } catch (error) {
            console.error('FCM token validation error:', error);
            return false;
        }
    }

    /**
     * 사용자별 알림 기록 생성
     */
    private async createNotificationLog(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        metadata?: any
    ): Promise<void> {
        try {
            await this.notificationLogRepository.create({
                userId,
                type,
                title,
                message,
                status: NotificationStatus.PENDING,
                metadata
            });
        } catch (error) {
            console.error('Failed to create notification log:', error);
        }
    }

    /**
     * 시스템 레벨 알림 기록 생성 (토픽 알림 등)
     */
    private async createSystemNotificationLog(
        type: NotificationType,
        title: string,
        message: string,
        metadata?: any
    ): Promise<void> {
        try {
            // 시스템 알림은 userId 없이 기록 (또는 시스템 사용자 ID 사용)
            await this.notificationLogRepository.create({
                userId: 'system', // 시스템 전용 ID
                type,
                title,
                message,
                status: NotificationStatus.SENT,
                metadata
            });
        } catch (error) {
            console.error('Failed to create system notification log:', error);
        }
    }

    /**
     * 실패한 알림 재시도
     */
    async retryFailedNotifications(limit: number = 10): Promise<number> {
        try {
            const failedLogs = await this.notificationLogRepository.getFailedNotifications(true, limit);
            let retryCount = 0;

            for (const log of failedLogs) {
                if (log.type === NotificationType.FCM && log.metadata?.fcmToken) {
                    const result = await this.sendFCMNotification(log.metadata.fcmToken, {
                        title: log.title,
                        body: log.message,
                        data: log.metadata
                    });

                    if (result.success) {
                        await this.notificationLogRepository.updateStatus(log.id, NotificationStatus.SENT);
                        retryCount++;
                    }
                } else if (log.type === NotificationType.EMAIL && log.metadata?.email) {
                    const success = await this.sendEmailNotification(
                        log.metadata.email,
                        log.title,
                        log.message
                    );

                    if (success) {
                        await this.notificationLogRepository.updateStatus(log.id, NotificationStatus.SENT);
                        retryCount++;
                    }
                }
            }

            return retryCount;
        } catch (error) {
            console.error('Error retrying failed notifications:', error);
            return 0;
        }
    }

    /**
     * 알림 통계 조회
     */
    async getNotificationStats(userId?: string, days: number = 7): Promise<any> {
        try {
            const typeStats = await this.notificationLogRepository.getStatsByType(userId);
            const dateStats = await this.notificationLogRepository.getStatsByDate(days, userId);
            const deliveryRate = await this.notificationLogRepository.getDeliveryRate();

            return {
                byType: typeStats,
                byDate: dateStats,
                deliveryRate
            };
        } catch (error) {
            console.error('Error getting notification stats:', error);
            return null;
        }
    }
} 