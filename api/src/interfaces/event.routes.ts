import { Router } from 'express';
import { EventController, validateCreateEvent, validateUpdateEvent, validateEventId, validateGetEvents, validatePopularEvents, validateSendNotification } from './event.controller';
import { authenticateAdmin, requireAdminGrade, authenticateApiKey } from './auth.middleware';

const router = Router();
const eventController = new EventController();

/**
 * @route   GET /api/events/types
 * @desc    이벤트 유형 목록 조회
 * @access  Public
 */
router.get('/types', eventController.getEventTypes);

/**
 * @route   GET /api/events/scopes
 * @desc    이벤트 범위 목록 조회
 * @access  Public
 */
router.get('/scopes', eventController.getEventScopes);

/**
 * @route   GET /api/events/active
 * @desc    활성 이벤트 조회
 * @access  Public
 */
router.get('/active', eventController.getActiveEvents);

/**
 * @route   GET /api/events/popular
 * @desc    인기 이벤트 조회
 * @access  Public
 */
router.get('/popular', validatePopularEvents, eventController.getPopularEvents);

// =============================================================================
// 공개 API (모바일 앱용) - API 키 인증 또는 인증 없음
// =============================================================================

/**
 * @route   GET /api/events
 * @desc    이벤트 목록 조회 (공개)
 * @access  Public
 */
router.get('/', validateGetEvents, eventController.getEvents);

/**
 * @route   GET /api/events/:event_id
 * @desc    이벤트 상세 조회 (공개)
 * @access  Public
 */
router.get('/:event_id', validateEventId, eventController.getEvent);

/**
 * @route   POST /api/events/:event_id/like
 * @desc    이벤트 좋아요 (모바일 앱용)
 * @access  Private (API Key)
 */
router.post('/:event_id/like', authenticateApiKey, validateEventId, eventController.likeEvent);

// =============================================================================
// 어드민 API - JWT 인증 필요
// =============================================================================

/**
 * @route   GET /api/admin/events/stats
 * @desc    이벤트 통계 조회 (어드민)
 * @access  Private (Admin)
 */
router.get('/admin/stats', authenticateAdmin, requireAdminGrade, eventController.getEventStats);

/**
 * @route   POST /api/admin/events
 * @desc    이벤트 생성 (어드민)
 * @access  Private (Admin)
 */
router.post('/admin', authenticateAdmin, requireAdminGrade, validateCreateEvent, eventController.createEvent);

/**
 * @route   GET /api/admin/events
 * @desc    이벤트 목록 조회 (어드민)
 * @access  Private (Admin)
 */
router.get('/admin', authenticateAdmin, requireAdminGrade, validateGetEvents, eventController.getEvents);

/**
 * @route   GET /api/admin/events/:event_id
 * @desc    이벤트 상세 조회 (어드민)
 * @access  Private (Admin)
 */
router.get('/admin/:event_id', authenticateAdmin, requireAdminGrade, validateEventId, eventController.getEvent);

/**
 * @route   PUT /api/admin/events/:event_id
 * @desc    이벤트 수정 (어드민)
 * @access  Private (Admin)
 */
router.put('/admin/:event_id', authenticateAdmin, requireAdminGrade, validateUpdateEvent, eventController.updateEvent);

/**
 * @route   DELETE /api/admin/events/:event_id
 * @desc    이벤트 삭제 (어드민)
 * @access  Private (Admin)
 */
router.delete('/admin/:event_id', authenticateAdmin, requireAdminGrade, validateEventId, eventController.deleteEvent);

/**
 * @route   POST /api/admin/events/:event_id/send-notification
 * @desc    이벤트 푸시 알림 발송 (어드민)
 * @access  Private (Admin)
 */
router.post('/admin/:event_id/send-notification', authenticateAdmin, requireAdminGrade, validateSendNotification, eventController.sendEventNotification);

export default router;
