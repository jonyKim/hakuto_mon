import { Router } from 'express';
import { EventController, validateCreateEvent, validateUpdateEvent, validateEventId, validateGetEvents, validatePopularEvents } from './event.controller';

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

/**
 * @route   GET /api/events/stats
 * @desc    이벤트 통계 조회
 * @access  Private (Admin)
 */
router.get('/stats', eventController.getEventStats);

/**
 * @route   POST /api/events
 * @desc    이벤트 생성 (어드민)
 * @access  Private (Admin)
 */
router.post('/', validateCreateEvent, eventController.createEvent);

/**
 * @route   GET /api/events
 * @desc    이벤트 목록 조회
 * @access  Public
 */
router.get('/', validateGetEvents, eventController.getEvents);

/**
 * @route   GET /api/events/:event_id
 * @desc    이벤트 상세 조회
 * @access  Public
 */
router.get('/:event_id', validateEventId, eventController.getEvent);

/**
 * @route   PUT /api/events/:event_id
 * @desc    이벤트 수정 (어드민)
 * @access  Private (Admin)
 */
router.put('/:event_id', validateUpdateEvent, eventController.updateEvent);

/**
 * @route   DELETE /api/events/:event_id
 * @desc    이벤트 삭제 (어드민)
 * @access  Private (Admin)
 */
router.delete('/:event_id', validateEventId, eventController.deleteEvent);

/**
 * @route   POST /api/events/:event_id/like
 * @desc    이벤트 좋아요
 * @access  Public
 */
router.post('/:event_id/like', validateEventId, eventController.likeEvent);

export default router;
