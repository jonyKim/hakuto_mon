import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { EventService } from '../application/event.service';
import { AlertRuleRepository } from '../infrastructure/repositories/alert_rule.repository';
import { EventRepository } from '../infrastructure/repositories/event.repository';
import { NotificationService } from '../application/notification.service';
import { FirebaseService } from '../application/firebase.service';
import { NotificationLogRepository } from '../infrastructure/repositories/notification_log.repository';
import { WalletUserRepository } from '../infrastructure/repositories/wallet_user.repository';

export class EventController {
    private eventService: EventService;

    constructor() {
        const eventRepository = new EventRepository();
        const alertRepository = new AlertRuleRepository();
        
        const firebaseService = FirebaseService.createFromEnv();
        firebaseService.initialize(); // Firebase 초기화
        
        // EmailService는 FCM 테스트에서 불필요하므로 null로 설정
        const emailService = null;
        const notificationLogRepository = new NotificationLogRepository();
        const userRepository = new WalletUserRepository();
        
        const notificationService = new NotificationService(
            firebaseService,
            emailService,
            notificationLogRepository,
            userRepository
        );

        this.eventService = new EventService(
            eventRepository,
            alertRepository,
            notificationService
        );
    }

    /**
     * 이벤트 생성 (어드민)
     */
    createEvent = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const {
                type,
                title,
                description,
                content,
                scope,
                priority,
                start_date,
                end_date,
                images,
                links,
                tags
            } = req.body;

            // JWT 토큰에서 생성자 정보 추출 (admin_users.id 사용)
            let created_by = (req as any).admin?.uuid_admin; // 실제로는 admin_users.id 값
            console.log('[EventController] JWT admin info:', (req as any).admin);
            console.log('[EventController] Initial created_by (admin id):', created_by);

            // JWT에서 나온 ID를 숫자로 변환해서 사용
            if (created_by && !isNaN(Number(created_by))) {
                created_by = Number(created_by); // admin_users.id (숫자)
                console.log('[EventController] Using created_by as number:', created_by);
            } else {
                // JWT 정보가 없는 경우 null 사용 (nullable 필드)
                created_by = null;
                console.log('[EventController] Using null for created_by (no valid admin id)');
            }

            const event = await this.eventService.createEvent({
                type,
                title,
                description,
                content,
                scope,
                priority,
                startDate: start_date ? new Date(start_date) : undefined,
                endDate: end_date ? new Date(end_date) : undefined,
                images,
                links,
                tags,
                createdBy: created_by
            });

            res.status(201).json({
                success: true,
                message: '이벤트가 성공적으로 생성되었습니다.',
                data: {
                    id: event.id,
                    type: event.type,
                    title: event.title,
                    description: event.description,
                    content: event.content,
                    scope: event.scope,
                    status: event.status,
                    priority: event.priority,
                    start_date: event.startDate,
                    end_date: event.endDate,
                    images: event.images,
                    links: event.links,
                    tags: event.tags,
                    view_count: event.viewCount,
                    like_count: event.likeCount,
                    created_by: event.createdBy,
                    created_at: event.createdAt
                }
            });

        } catch (error: any) {
            console.error('Error creating event:', error);
            res.status(500).json({
                success: false,
                message: error.message || '이벤트 생성 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 이벤트 목록 조회
     */
    getEvents = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const {
                type,
                scope,
                status,
                search,
                page = 1,
                limit = 20
            } = req.query;

            const result = await this.eventService.getEvents(
                type as string,
                scope as string,
                status as string,
                Number(page),
                Number(limit),
                search as string
            );

            res.status(200).json({
                success: true,
                data: {
                    events: result.events.map(event => ({
                        id: event.id,
                        type: event.type,
                        title: event.title,
                        description: event.description,
                        scope: event.scope,
                        status: event.status,
                        priority: event.priority,
                        start_date: event.startDate,
                        end_date: event.endDate,
                        images: event.images,
                        links: event.links,
                        tags: event.tags,
                        view_count: event.viewCount,
                        like_count: event.likeCount,
                        created_by: event.createdBy,
                        created_at: event.createdAt,
                        updated_at: event.updatedAt
                    })),
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.total,
                        totalPages: result.totalPages
                    }
                }
            });

        } catch (error) {
            console.error('Error getting events:', error);
            res.status(500).json({
                success: false,
                message: '이벤트 목록 조회 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 이벤트 상세 조회
     */
    getEvent = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { event_id } = req.params;

            const event = await this.eventService.getEventById(event_id);
            if (!event) {
                res.status(404).json({
                    success: false,
                    message: '이벤트를 찾을 수 없습니다.'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    id: event.id,
                    type: event.type,
                    title: event.title,
                    description: event.description,
                    content: event.content,
                    scope: event.scope,
                    status: event.status,
                    priority: event.priority,
                    start_date: event.startDate,
                    end_date: event.endDate,
                    images: event.images,
                    links: event.links,
                    tags: event.tags,
                    view_count: event.viewCount,
                    like_count: event.likeCount,
                    created_by: event.createdBy,
                    created_at: event.createdAt,
                    updated_at: event.updatedAt
                }
            });

        } catch (error) {
            console.error('Error getting event:', error);
            res.status(500).json({
                success: false,
                message: '이벤트 조회 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 이벤트 수정 (어드민)
     */
    updateEvent = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { event_id } = req.params;
            const {
                title,
                description,
                content,
                scope,
                status,
                priority,
                start_date,
                end_date,
                images,
                links,
                tags
            } = req.body;

            const updatedEvent = await this.eventService.updateEvent(event_id, {
                title,
                description,
                content,
                scope,
                status,
                priority,
                startDate: start_date ? new Date(start_date) : undefined,
                endDate: end_date ? new Date(end_date) : undefined,
                images,
                links,
                tags
            });

            if (!updatedEvent) {
                res.status(404).json({
                    success: false,
                    message: '이벤트를 찾을 수 없습니다.'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: '이벤트가 성공적으로 수정되었습니다.',
                data: {
                    id: updatedEvent.id,
                    type: updatedEvent.type,
                    title: updatedEvent.title,
                    description: updatedEvent.description,
                    content: updatedEvent.content,
                    scope: updatedEvent.scope,
                    status: updatedEvent.status,
                    priority: updatedEvent.priority,
                    start_date: updatedEvent.startDate,
                    end_date: updatedEvent.endDate,
                    images: updatedEvent.images,
                    links: updatedEvent.links,
                    tags: updatedEvent.tags,
                    view_count: updatedEvent.viewCount,
                    like_count: updatedEvent.likeCount,
                    updated_at: updatedEvent.updatedAt
                }
            });

        } catch (error: any) {
            console.error('Error updating event:', error);
            res.status(500).json({
                success: false,
                message: error.message || '이벤트 수정 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 이벤트 삭제 (어드민)
     */
    deleteEvent = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { event_id } = req.params;

            await this.eventService.deleteEvent(event_id);

            res.status(200).json({
                success: true,
                message: '이벤트가 성공적으로 삭제되었습니다.'
            });

        } catch (error: any) {
            console.error('Error deleting event:', error);
            
            if (error.message.includes('찾을 수 없습니다')) {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: '이벤트 삭제 중 오류가 발생했습니다.'
                });
            }
        }
    };

    /**
     * 이벤트 좋아요
     */
    likeEvent = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { event_id } = req.params;

            const event = await this.eventService.likeEvent(event_id);
            if (!event) {
                res.status(404).json({
                    success: false,
                    message: '이벤트를 찾을 수 없습니다.'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: '이벤트에 좋아요를 눌렀습니다.',
                data: {
                    like_count: event.likeCount
                }
            });

        } catch (error) {
            console.error('Error liking event:', error);
            res.status(500).json({
                success: false,
                message: '좋아요 처리 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 이벤트 유형 목록 조회
     */
    getEventTypes = async (_req: Request, res: Response): Promise<void> => {
        try {
            const types = await this.eventService.getEventTypes();

            res.status(200).json({
                success: true,
                data: types
            });

        } catch (error) {
            console.error('Error getting event types:', error);
            res.status(500).json({
                success: false,
                message: '이벤트 유형 조회 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 이벤트 범위 목록 조회
     */
    getEventScopes = async (_req: Request, res: Response): Promise<void> => {
        try {
            const scopes = await this.eventService.getEventScopes();

            res.status(200).json({
                success: true,
                data: scopes
            });

        } catch (error) {
            console.error('Error getting event scopes:', error);
            res.status(500).json({
                success: false,
                message: '이벤트 범위 조회 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 활성 이벤트 조회
     */
    getActiveEvents = async (_req: Request, res: Response): Promise<void> => {
        try {
            const events = await this.eventService.getActiveEvents();

            res.status(200).json({
                success: true,
                data: events.map(event => ({
                    id: event.id,
                    type: event.type,
                    title: event.title,
                    description: event.description,
                    scope: event.scope,
                    status: event.status,
                    priority: event.priority,
                    start_date: event.startDate,
                    end_date: event.endDate,
                    images: event.images,
                    links: event.links,
                    tags: event.tags,
                    view_count: event.viewCount,
                    like_count: event.likeCount,
                    created_at: event.createdAt
                }))
            });

        } catch (error) {
            console.error('Error getting active events:', error);
            res.status(500).json({
                success: false,
                message: '활성 이벤트 조회 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 인기 이벤트 조회
     */
    getPopularEvents = async (req: Request, res: Response): Promise<void> => {
        try {
            const { limit = 10 } = req.query;

            const events = await this.eventService.getPopularEvents(Number(limit));

            res.status(200).json({
                success: true,
                data: events.map(event => ({
                    id: event.id,
                    type: event.type,
                    title: event.title,
                    description: event.description,
                    scope: event.scope,
                    status: event.status,
                    priority: event.priority,
                    start_date: event.startDate,
                    end_date: event.endDate,
                    images: event.images,
                    links: event.links,
                    tags: event.tags,
                    view_count: event.viewCount,
                    like_count: event.likeCount,
                    created_at: event.createdAt
                }))
            });

        } catch (error) {
            console.error('Error getting popular events:', error);
            res.status(500).json({
                success: false,
                message: '인기 이벤트 조회 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 이벤트 통계 조회
     */
    getEventStats = async (_req: Request, res: Response): Promise<void> => {
        try {
            const stats = await this.eventService.getEventStats();

            res.status(200).json({
                success: true,
                data: {
                    ...stats,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error getting event stats:', error);
            res.status(500).json({
                success: false,
                message: '이벤트 통계 조회 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 이벤트 푸시 알림 발송 (어드민 전용)
     */
    sendEventNotification = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { event_id } = req.params;
            const { customMessage } = req.body;

            const event = await this.eventService.getEventById(event_id);
            if (!event) {
                res.status(404).json({
                    success: false,
                    message: '이벤트를 찾을 수 없습니다.'
                });
                return;
            }

            // FCM 토큰이 등록된 모든 wallet_users 조회 (기본 접근 방식)
            const walletUserRepository = new WalletUserRepository();
            const usersWithFCM = await walletUserRepository.findUsersWithFCMToken();
            
            console.log(`[EventController] 이벤트 알림 발송 대상: ${usersWithFCM.length}명 (FCM 토큰 보유 사용자)`);

            // 각 사용자에게 푸시 알림 발송
            const notificationPromises = usersWithFCM.map(async (user) => {
                try {
                    const title = `🎉 ${event.title}`;
                    const message = customMessage || event.description || '새로운 이벤트가 등록되었습니다.';

                    await this.eventService.sendNotificationToUser(user.id, {
                        title,
                        message,
                        data: {
                            type: 'event',
                            eventId: event.id,
                            eventType: event.type,
                            scope: event.scope,
                            userId: user.id
                        }
                    });

                    console.log(`[EventController] 알림 발송 성공: ${user.id} (${user.email})`);
                    return { userId: user.id, email: user.email, success: true };
                } catch (error) {
                    console.error(`[EventController] 알림 발송 실패 ${user.id}:`, error);
                    return { 
                        userId: user.id, 
                        email: user.email,
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
                    totalTargets: usersWithFCM.length,
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
    };
}

// 유효성 검사 미들웨어들
export const validateCreateEvent = [
    body('type')
        .isIn(['project_announcement', 'partnership', 'token_listing', 'staking_event', 'nft_drop', 'airdrop'])
        .withMessage('유효한 이벤트 유형을 선택해주세요.'),
    body('title')
        .notEmpty()
        .withMessage('이벤트 제목은 필수입니다.')
        .isLength({ min: 1, max: 255 })
        .withMessage('이벤트 제목은 1-255자 사이여야 합니다.'),
    body('scope')
        .isIn(['all_projects', 'hakuto_token', 'ecosystem', 'defi', 'nft'])
        .withMessage('유효한 이벤트 범위를 선택해주세요.'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('유효한 우선순위를 선택해주세요.'),
    body('start_date')
        .optional()
        .isISO8601()
        .withMessage('유효한 시작 날짜를 입력해주세요.'),
    body('end_date')
        .optional()
        .isISO8601()
        .withMessage('유효한 종료 날짜를 입력해주세요.')
    // created_by는 JWT 토큰에서 자동으로 추출됨
];

export const validateUpdateEvent = [
    param('event_id')
        .isUUID()
        .withMessage('유효한 이벤트 ID를 입력해주세요.'),
    body('title')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('이벤트 제목은 1-255자 사이여야 합니다.'),
    body('scope')
        .optional()
        .isIn(['all_projects', 'hakuto_token', 'ecosystem', 'defi', 'nft'])
        .withMessage('유효한 이벤트 범위를 선택해주세요.'),
    body('status')
        .optional()
        .isIn(['upcoming', 'active', 'ended'])
        .withMessage('유효한 상태를 선택해주세요.'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('유효한 우선순위를 선택해주세요.'),
    body('start_date')
        .optional()
        .isISO8601()
        .withMessage('유효한 시작 날짜를 입력해주세요.'),
    body('end_date')
        .optional()
        .isISO8601()
        .withMessage('유효한 종료 날짜를 입력해주세요.')
];

export const validateEventId = [
    param('event_id')
        .isUUID()
        .withMessage('유효한 이벤트 ID를 입력해주세요.')
];

export const validateGetEvents = [
    query('type')
        .optional()
        .isIn(['project_announcement', 'partnership', 'token_listing', 'staking_event', 'nft_drop', 'airdrop'])
        .withMessage('유효한 이벤트 유형을 선택해주세요.'),
    query('scope')
        .optional()
        .isIn(['all_projects', 'hakuto_token', 'ecosystem', 'defi', 'nft'])
        .withMessage('유효한 이벤트 범위를 선택해주세요.'),
    query('status')
        .optional()
        .isIn(['upcoming', 'active', 'ended'])
        .withMessage('유효한 상태를 선택해주세요.'),
    query('search')
        .optional()
        .isLength({ max: 100 })
        .withMessage('검색어는 100자 이하여야 합니다.'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('페이지는 1 이상의 정수여야 합니다.'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit은 1~100 사이의 정수여야 합니다.')
];

export const validatePopularEvents = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('limit은 1~50 사이의 정수여야 합니다.')
];

export const validateSendNotification = [
    param('event_id')
        .isUUID()
        .withMessage('유효한 이벤트 ID를 입력해주세요.'),
    body('customMessage')
        .optional()
        .isLength({ max: 500 })
        .withMessage('메시지는 500자 이하여야 합니다.'),
    body('targetScope')
        .optional()
        .isIn(['all_projects', 'hakuto_token', 'ecosystem', 'defi', 'nft'])
        .withMessage('유효한 타겟 범위를 선택해주세요.')
];
