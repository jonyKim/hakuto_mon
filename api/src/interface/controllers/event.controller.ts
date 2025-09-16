import { Request, Response } from 'express';
import { EventService } from '../../application/event.service';
import { NotificationService } from '../../application/notification.service';
import { AlertRuleRepository } from '../../infrastructure/repositories/alert_rule.repository';
import { NotificationType } from '../../domain/entities/notification_history.entity';

export class EventController {
    constructor(
        private eventService: EventService,
        private notificationService: NotificationService,
        private alertRuleRepository: AlertRuleRepository
    ) {}

    /**
     * 이벤트 생성 (어드민 전용)
     * POST /api/admin/events
     */
    async createEvent(req: Request, res: Response): Promise<void> {
        try {
            const {
                type,
                title,
                description,
                content,
                scope,
                status = 'upcoming',
                priority = 'medium',
                startDate,
                endDate,
                metadata,
                images,
                links,
                tags
            } = req.body;

            // 어드민 권한 확인 (미들웨어에서 처리되어야 함)
            const adminId = req.user?.uuid_admin;
            if (!adminId) {
                res.status(401).json({ 
                    success: false, 
                    message: '어드민 권한이 필요합니다.' 
                });
                return;
            }

            const event = await this.eventService.createEvent({
                type,
                title,
                description,
                content,
                scope,
                status,
                priority,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                metadata,
                images,
                links,
                tags,
                createdBy: adminId
            });

            res.status(201).json({
                success: true,
                message: '이벤트가 성공적으로 생성되었습니다.',
                data: event
            });
        } catch (error) {
            console.error('[EventController] 이벤트 생성 실패:', error);
            res.status(500).json({
                success: false,
                message: '이벤트 생성 중 오류가 발생했습니다.',
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            });
        }
    }

    /**
     * 이벤트 목록 조회
     * GET /api/admin/events
     */
    async getEvents(req: Request, res: Response): Promise<void> {
        try {
            const {
                type,
                scope,
                status,
                page = 1,
                limit = 10,
                search
            } = req.query;

            const result = await this.eventService.getEvents(
                type as string,
                scope as string,
                status as string,
                parseInt(page as string),
                parseInt(limit as string),
                search as string
            );

            res.json({
                success: true,
                data: result.events,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total: result.total,
                    totalPages: Math.ceil(result.total / parseInt(limit as string))
                }
            });
        } catch (error) {
            console.error('[EventController] 이벤트 목록 조회 실패:', error);
            res.status(500).json({
                success: false,
                message: '이벤트 목록 조회 중 오류가 발생했습니다.',
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            });
        }
    }

    /**
     * 이벤트 상세 조회
     * GET /api/admin/events/:id
     */
    async getEventById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const event = await this.eventService.getEventById(id);
            if (!event) {
                res.status(404).json({
                    success: false,
                    message: '이벤트를 찾을 수 없습니다.'
                });
                return;
            }

            res.json({
                success: true,
                data: event
            });
        } catch (error) {
            console.error('[EventController] 이벤트 조회 실패:', error);
            res.status(500).json({
                success: false,
                message: '이벤트 조회 중 오류가 발생했습니다.',
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            });
        }
    }

    /**
     * 이벤트 수정 (어드민 전용)
     * PUT /api/admin/events/:id
     */
    async updateEvent(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // startDate, endDate 처리
            if (updateData.startDate) {
                updateData.startDate = new Date(updateData.startDate);
            }
            if (updateData.endDate) {
                updateData.endDate = new Date(updateData.endDate);
            }

            const event = await this.eventService.updateEvent(id, updateData);
            if (!event) {
                res.status(404).json({
                    success: false,
                    message: '이벤트를 찾을 수 없습니다.'
                });
                return;
            }

            res.json({
                success: true,
                message: '이벤트가 성공적으로 수정되었습니다.',
                data: event
            });
        } catch (error) {
            console.error('[EventController] 이벤트 수정 실패:', error);
            res.status(500).json({
                success: false,
                message: '이벤트 수정 중 오류가 발생했습니다.',
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            });
        }
    }

    /**
     * 이벤트 삭제 (어드민 전용)
     * DELETE /api/admin/events/:id
     */
    async deleteEvent(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const event = await this.eventService.getEventById(id);
            if (!event) {
                res.status(404).json({
                    success: false,
                    message: '이벤트를 찾을 수 없습니다.'
                });
                return;
            }

            await this.eventService.deleteEvent(id);

            res.json({
                success: true,
                message: '이벤트가 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            console.error('[EventController] 이벤트 삭제 실패:', error);
            res.status(500).json({
                success: false,
                message: '이벤트 삭제 중 오류가 발생했습니다.',
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            });
        }
    }

    /**
     * 이벤트 푸시 알림 발송 (어드민 전용)
     * POST /api/admin/events/:id/send-notification
     */
    async sendEventNotification(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { customMessage, targetScope } = req.body;

            const event = await this.eventService.getEventById(id);
            if (!event) {
                res.status(404).json({
                    success: false,
                    message: '이벤트를 찾을 수 없습니다.'
                });
                return;
            }

            // Event Alert를 설정한 사용자들 조회
            const eventAlerts = await this.alertRuleRepository.findByType('event');
            
            // 스코프에 따른 필터링
            const filteredAlerts = eventAlerts.filter(alert => {
                const alertScope = alert.conditions?.scope;
                const eventScope = targetScope || event.scope;
                
                // 'all_projects'인 경우 모든 이벤트 수신
                if (alertScope === 'all_projects') return true;
                
                // 특정 스코프가 일치하는 경우
                return alertScope === eventScope;
            });

            console.log(`[EventController] 이벤트 알림 발송 대상: ${filteredAlerts.length}명`);

            // 각 사용자에게 푸시 알림 발송
            const notificationPromises = filteredAlerts.map(async (alert) => {
                try {
                    const title = `🎉 ${event.title}`;
                    const message = customMessage || event.description || '새로운 이벤트가 등록되었습니다.';

                    await this.notificationService.sendAlert({
                        userId: alert.userId,
                        title,
                        message,
                        data: {
                            type: 'event',
                            eventId: event.id,
                            eventType: event.type,
                            scope: event.scope,
                            alertId: alert.id
                        },
                        preferredType: 'push' // FCM 푸시 알림
                    });

                    console.log(`[EventController] 알림 발송 성공: ${alert.userId}`);
                    return { userId: alert.userId, success: true };
                } catch (error) {
                    console.error(`[EventController] 알림 발송 실패 ${alert.userId}:`, error);
                    return { 
                        userId: alert.userId, 
                        success: false, 
                        error: error instanceof Error ? error.message : '알 수 없는 오류' 
                    };
                }
            });

            const results = await Promise.all(notificationPromises);
            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;

            res.json({
                success: true,
                message: `이벤트 알림이 발송되었습니다.`,
                data: {
                    eventId: event.id,
                    eventTitle: event.title,
                    totalTargets: filteredAlerts.length,
                    successCount,
                    failCount,
                    results
                }
            });
        } catch (error) {
            console.error('[EventController] 이벤트 알림 발송 실패:', error);
            res.status(500).json({
                success: false,
                message: '이벤트 알림 발송 중 오류가 발생했습니다.',
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            });
        }
    }

    /**
     * 이벤트 타입 목록 조회
     * GET /api/admin/events/types
     */
    async getEventTypes(req: Request, res: Response): Promise<void> {
        try {
            const types = await this.eventService.getEventTypes();
            res.json({
                success: true,
                data: types
            });
        } catch (error) {
            console.error('[EventController] 이벤트 타입 조회 실패:', error);
            res.status(500).json({
                success: false,
                message: '이벤트 타입 조회 중 오류가 발생했습니다.',
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            });
        }
    }

    /**
     * 이벤트 스코프 목록 조회
     * GET /api/admin/events/scopes
     */
    async getEventScopes(req: Request, res: Response): Promise<void> {
        try {
            const scopes = await this.eventService.getEventScopes();
            res.json({
                success: true,
                data: scopes
            });
        } catch (error) {
            console.error('[EventController] 이벤트 스코프 조회 실패:', error);
            res.status(500).json({
                success: false,
                message: '이벤트 스코프 조회 중 오류가 발생했습니다.',
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            });
        }
    }

    /**
     * 모바일 앱용 이벤트 목록 조회 (공개 API)
     * GET /api/events
     */
    async getPublicEvents(req: Request, res: Response): Promise<void> {
        try {
            const {
                type,
                scope,
                status = 'active',
                page = 1,
                limit = 20
            } = req.query;

            const result = await this.eventService.getEvents(
                type as string,
                scope as string,
                status as string,
                parseInt(page as string),
                parseInt(limit as string)
            );

            // 공개용이므로 민감한 정보 제거
            const publicEvents = result.events.map(event => ({
                id: event.id,
                type: event.type,
                title: event.title,
                description: event.description,
                scope: event.scope,
                status: event.status,
                priority: event.priority,
                startDate: event.startDate,
                endDate: event.endDate,
                images: event.images,
                links: event.links,
                tags: event.tags,
                viewCount: event.viewCount,
                likeCount: event.likeCount,
                createdAt: event.createdAt
            }));

            res.json({
                success: true,
                data: publicEvents,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total: result.total,
                    totalPages: Math.ceil(result.total / parseInt(limit as string))
                }
            });
        } catch (error) {
            console.error('[EventController] 공개 이벤트 목록 조회 실패:', error);
            res.status(500).json({
                success: false,
                message: '이벤트 목록 조회 중 오류가 발생했습니다.',
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            });
        }
    }
}
