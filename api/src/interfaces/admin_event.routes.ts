import { Router } from 'express';
import { EventController, validateCreateEvent, validateUpdateEvent, validateEventId, validateGetEvents, validateSendNotification } from './event.controller';
import { authenticateAdmin, requireAdminGrade } from './auth.middleware';

const router = Router();
const eventController = new EventController();

// =============================================================================
// 어드민 전용 Event API - JWT 인증 필요
// =============================================================================

/**
 * @route   GET /api/admin/events/stats
 * @desc    이벤트 통계 조회 (어드민)
 * @access  Private (Admin)
 */
router.get('/stats', authenticateAdmin, requireAdminGrade, eventController.getEventStats);

/**
 * @route   POST /api/admin/events
 * @desc    이벤트 생성 (어드민)
 * @access  Private (Admin)
 */
router.post('/', authenticateAdmin, requireAdminGrade, validateCreateEvent, eventController.createEvent);

/**
 * @route   GET /api/admin/events
 * @desc    이벤트 목록 조회 (어드민)
 * @access  Private (Admin)
 */
router.get('/', authenticateAdmin, requireAdminGrade, validateGetEvents, eventController.getEvents);

/**
 * @route   GET /api/admin/events/:event_id
 * @desc    이벤트 상세 조회 (어드민)
 * @access  Private (Admin)
 */
router.get('/:event_id', authenticateAdmin, requireAdminGrade, validateEventId, eventController.getEvent);

/**
 * @route   PUT /api/admin/events/:event_id
 * @desc    이벤트 수정 (어드민)
 * @access  Private (Admin)
 */
router.put('/:event_id', authenticateAdmin, requireAdminGrade, validateUpdateEvent, eventController.updateEvent);

/**
 * @route   DELETE /api/admin/events/:event_id
 * @desc    이벤트 삭제 (어드민)
 * @access  Private (Admin)
 */
router.delete('/:event_id', authenticateAdmin, requireAdminGrade, validateEventId, eventController.deleteEvent);

/**
 * @route   POST /api/admin/events/:event_id/send-notification
 * @desc    이벤트 푸시 알림 발송 (어드민)
 * @access  Private (Admin)
 */
router.post('/:event_id/send-notification', authenticateAdmin, requireAdminGrade, validateSendNotification, eventController.sendEventNotification);

export default router;
