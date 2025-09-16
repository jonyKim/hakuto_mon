import { EventRepository } from '../infrastructure/repositories/event.repository';
import { AlertRuleRepository } from '../infrastructure/repositories/alert_rule.repository';
import { NotificationService } from './notification.service';
import { Event, EventLink } from '../domain/entities/event.entity';
import { NotificationType } from '../domain/entities/notification_log.entity';

export interface CreateEventRequest {
    type: 'project_announcement' | 'partnership' | 'token_listing' | 'staking_event' | 'nft_drop' | 'airdrop';
    title: string;
    description?: string;
    content?: string;
    scope: 'all_projects' | 'hakuto_token' | 'ecosystem' | 'defi' | 'nft';
    priority?: 'low' | 'medium' | 'high';
    startDate?: Date;
    endDate?: Date;
    images?: string[];
    links?: EventLink[];
    tags?: string[];
    createdBy: string;
}

export interface UpdateEventRequest {
    id: string;
    title?: string;
    description?: string;
    content?: string;
    scope?: 'all_projects' | 'hakuto_token' | 'ecosystem' | 'defi' | 'nft';
    status?: 'upcoming' | 'active' | 'ended';
    priority?: 'low' | 'medium' | 'high';
    startDate?: Date;
    endDate?: Date;
    images?: string[];
    links?: EventLink[];
    tags?: string[];
}

export interface EventListResponse {
    events: Event[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface EventStats {
    totalEvents: number;
    activeEvents: number;
    upcomingEvents: number;
    endedEvents: number;
    byType: { [key: string]: number };
    byScope: { [key: string]: number };
    popularEvents: Event[];
}

export class EventService {
    private eventRepository: EventRepository;
    private alertRepository: AlertRuleRepository;
    private notificationService: NotificationService;

    constructor(
        eventRepository: EventRepository,
        alertRepository: AlertRuleRepository,
        notificationService: NotificationService
    ) {
        this.eventRepository = eventRepository;
        this.alertRepository = alertRepository;
        this.notificationService = notificationService;
    }

    /**
     * 이벤트 생성
     */
    async createEvent(request: CreateEventRequest): Promise<Event> {
        try {
            const event = await this.eventRepository.create({
                type: request.type,
                title: request.title,
                description: request.description,
                content: request.content,
                scope: request.scope,
                priority: request.priority || 'medium',
                startDate: request.startDate,
                endDate: request.endDate,
                images: request.images || [],
                links: request.links || [],
                tags: request.tags || [],
                createdBy: request.createdBy,
                status: 'upcoming'
            });

            console.log(`Event created: ${event.id} - ${event.title}`);

            // 이벤트 알림 구독자들에게 알림 발송
            await this.notifyEventSubscribers(event, 'created');

            return event;

        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    }

    /**
     * 이벤트 목록 조회
     */
    async getEvents(
        type?: string,
        scope?: string,
        status?: string,
        page: number = 1,
        limit: number = 20,
        search?: string
    ): Promise<EventListResponse> {
        try {
            const { events, total } = await this.eventRepository.findAll(type, scope, status, page, limit, search);
            const totalPages = Math.ceil(total / limit);

            return {
                events,
                total,
                page,
                limit,
                totalPages
            };

        } catch (error) {
            console.error('Error getting events:', error);
            throw error;
        }
    }

    /**
     * 이벤트 상세 조회
     */
    async getEventById(eventId: string): Promise<Event | null> {
        try {
            const event = await this.eventRepository.findById(eventId);
            
            if (event) {
                // 조회수 증가
                await this.eventRepository.incrementViewCount(eventId);
            }

            return event;

        } catch (error) {
            console.error('Error getting event:', error);
            throw error;
        }
    }

    /**
     * 이벤트 수정
     */
    async updateEvent(id: string, updateData: Partial<Event>): Promise<Event | null> {
        try {
            const existingEvent = await this.eventRepository.findById(id);
            if (!existingEvent) {
                throw new Error('이벤트를 찾을 수 없습니다.');
            }

            const updatedEvent = await this.eventRepository.update(id, updateData);

            if (updatedEvent) {
                console.log(`Event updated: ${id} - ${updatedEvent.title}`);
                
                // 상태 변경 시 알림 발송
                if (updateData.status && updateData.status !== existingEvent.status) {
                    await this.notifyEventSubscribers(updatedEvent, 'status_changed');
                }
            }

            return updatedEvent;

        } catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    }

    /**
     * 이벤트 삭제
     */
    async deleteEvent(eventId: string): Promise<void> {
        try {
            const event = await this.eventRepository.findById(eventId);
            if (!event) {
                throw new Error('이벤트를 찾을 수 없습니다.');
            }

            await this.eventRepository.delete(eventId);
            console.log(`Event deleted: ${eventId} - ${event.title}`);

        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }

    /**
     * 활성 이벤트 조회
     */
    async getActiveEvents(): Promise<Event[]> {
        try {
            return await this.eventRepository.findActiveEvents();
        } catch (error) {
            console.error('Error getting active events:', error);
            throw error;
        }
    }

    /**
     * 예정된 이벤트 조회
     */
    async getUpcomingEvents(): Promise<Event[]> {
        try {
            return await this.eventRepository.findUpcomingEvents();
        } catch (error) {
            console.error('Error getting upcoming events:', error);
            throw error;
        }
    }

    /**
     * 범위별 이벤트 조회
     */
    async getEventsByScope(scope: 'all_projects' | 'hakuto_token' | 'ecosystem' | 'defi' | 'nft'): Promise<Event[]> {
        try {
            return await this.eventRepository.findEventsByScope(scope);
        } catch (error) {
            console.error('Error getting events by scope:', error);
            throw error;
        }
    }

    /**
     * 인기 이벤트 조회
     */
    async getPopularEvents(limit: number = 10): Promise<Event[]> {
        try {
            return await this.eventRepository.findPopularEvents(limit);
        } catch (error) {
            console.error('Error getting popular events:', error);
            throw error;
        }
    }

    /**
     * 최근 이벤트 조회
     */
    async getRecentEvents(limit: number = 10): Promise<Event[]> {
        try {
            return await this.eventRepository.findRecentEvents(limit);
        } catch (error) {
            console.error('Error getting recent events:', error);
            throw error;
        }
    }

    /**
     * 이벤트 좋아요
     */
    async likeEvent(eventId: string): Promise<Event | null> {
        try {
            const event = await this.eventRepository.incrementLikeCount(eventId);
            
            if (event) {
                console.log(`Event liked: ${eventId} - Total likes: ${event.likeCount}`);
            }

            return event;

        } catch (error) {
            console.error('Error liking event:', error);
            throw error;
        }
    }

    /**
     * 이벤트 상태 자동 업데이트
     */
    async updateEventStatuses(): Promise<void> {
        try {
            await this.eventRepository.updateExpiredEvents();
            console.log('Event statuses updated automatically');

        } catch (error) {
            console.error('Error updating event statuses:', error);
        }
    }

    /**
     * 이벤트 유형 목록 조회
     */
    async getEventTypes(): Promise<Array<{
        value: string;
        label: string;
        description: string;
    }>> {
        return [
            {
                value: 'project_announcement',
                label: '프로젝트 발표',
                description: '새로운 프로젝트나 업데이트 발표'
            },
            {
                value: 'partnership',
                label: '파트너십',
                description: '새로운 파트너십 및 협력 발표'
            },
            {
                value: 'token_listing',
                label: '토큰 상장',
                description: '새로운 거래소 상장 소식'
            },
            {
                value: 'staking_event',
                label: '스테이킹 이벤트',
                description: '스테이킹 관련 이벤트 및 보상'
            },
            {
                value: 'nft_drop',
                label: 'NFT 드롭',
                description: 'NFT 출시 및 드롭 이벤트'
            },
            {
                value: 'airdrop',
                label: '에어드롭',
                description: '토큰 에어드롭 이벤트'
            }
        ];
    }

    /**
     * 이벤트 범위 목록 조회
     */
    async getEventScopes(): Promise<Array<{
        value: string;
        label: string;
        description: string;
    }>> {
        return [
            {
                value: 'all_projects',
                label: '모든 프로젝트',
                description: '전체 프로젝트 관련 이벤트'
            },
            {
                value: 'hakuto_token',
                label: '하쿠토 토큰',
                description: 'HKTM 토큰 관련 이벤트'
            },
            {
                value: 'ecosystem',
                label: '생태계',
                description: '하쿠토 생태계 프로젝트'
            },
            {
                value: 'defi',
                label: 'DeFi',
                description: 'DeFi 프로토콜 관련 이벤트'
            },
            {
                value: 'nft',
                label: 'NFT',
                description: 'NFT 프로젝트 관련 이벤트'
            }
        ];
    }

    /**
     * 이벤트 통계 조회
     */
    async getEventStats(): Promise<EventStats> {
        try {
            const totalEvents = await this.eventRepository.count();
            const activeEvents = await this.eventRepository.countByStatus('active');
            const upcomingEvents = await this.eventRepository.countByStatus('upcoming');
            const endedEvents = await this.eventRepository.countByStatus('ended');

            const byType = {
                project_announcement: await this.eventRepository.countByType('project_announcement'),
                partnership: await this.eventRepository.countByType('partnership'),
                token_listing: await this.eventRepository.countByType('token_listing'),
                staking_event: await this.eventRepository.countByType('staking_event'),
                nft_drop: await this.eventRepository.countByType('nft_drop'),
                airdrop: await this.eventRepository.countByType('airdrop')
            };

            const byScope = {
                all_projects: await this.eventRepository.countByScope('all_projects'),
                hakuto_token: await this.eventRepository.countByScope('hakuto_token'),
                ecosystem: await this.eventRepository.countByScope('ecosystem'),
                defi: await this.eventRepository.countByScope('defi'),
                nft: await this.eventRepository.countByScope('nft')
            };

            const popularEvents = await this.eventRepository.findPopularEvents(5);

            return {
                totalEvents,
                activeEvents,
                upcomingEvents,
                endedEvents,
                byType,
                byScope,
                popularEvents
            };

        } catch (error) {
            console.error('Error getting event stats:', error);
            throw error;
        }
    }

    /**
     * 이벤트 구독자들에게 알림 발송
     */
    private async notifyEventSubscribers(event: Event, action: 'created' | 'status_changed'): Promise<void> {
        try {
            // 이벤트 알림을 구독한 사용자들 조회
            const eventAlerts = await this.alertRepository.findActiveAlertsByType('event');

            for (const alert of eventAlerts) {
                try {
                    // 이벤트 범위와 알림 조건 매칭 확인
                    if (this.shouldNotifyForEvent(alert, event)) {
                        let title = '';
                        let message = '';

                        if (action === 'created') {
                            title = `새로운 ${this.getEventTypeLabel(event.type)} 이벤트`;
                            message = `${event.title}\n\n${event.description || '자세한 내용을 확인해보세요.'}`;
                        } else if (action === 'status_changed') {
                            title = `이벤트 상태 변경: ${event.title}`;
                            message = `이벤트 상태가 "${this.getStatusLabel(event.status)}"로 변경되었습니다.`;
                        }

                        // FCM 알림 발송
                        const user = await alert.user;
                        if (user?.fcmToken) {
                            await this.notificationService.sendFCMNotification(user.fcmToken, {
                                title,
                                body: message,
                                data: {
                                    eventId: event.id,
                                    eventType: event.type,
                                    action
                                }
                            });
                        }
                    }
                } catch (alertError) {
                    console.error(`Error sending event notification to alert ${alert.id}:`, alertError);
                }
            }

        } catch (error) {
            console.error('Error notifying event subscribers:', error);
        }
    }

    /**
     * 알림 조건과 이벤트 매칭 확인
     */
    private shouldNotifyForEvent(alert: AlertRule, event: Event): boolean {
        // 알림 조건에서 이벤트 범위 확인
        // 실제 구현에서는 더 복잡한 매칭 로직 필요
        return true; // 임시로 모든 이벤트에 대해 알림
    }

    /**
     * 이벤트 유형 라벨 조회
     */
    private getEventTypeLabel(type: string): string {
        const typeLabels: { [key: string]: string } = {
            'project_announcement': '프로젝트 발표',
            'partnership': '파트너십',
            'token_listing': '토큰 상장',
            'staking_event': '스테이킹 이벤트',
            'nft_drop': 'NFT 드롭',
            'airdrop': '에어드롭'
        };

        return typeLabels[type] || type;
    }

    /**
     * 상태 라벨 조회
     */
    private getStatusLabel(status: string): string {
        const statusLabels: { [key: string]: string } = {
            'upcoming': '예정',
            'active': '진행중',
            'ended': '종료'
        };

        return statusLabels[status] || status;
    }

    /**
     * 사용자에게 알림 발송
     */
    async sendNotificationToUser(userId: string, notification: {
        title: string;
        message: string;
        data: any;
    }): Promise<void> {
        try {
            await this.notificationService.sendNotification({
                userId,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                preferredType: NotificationType.FCM
            });
        } catch (error) {
            console.error(`Failed to send notification to user ${userId}:`, error);
            throw error;
        }
    }
}
