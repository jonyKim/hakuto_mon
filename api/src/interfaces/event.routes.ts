import { Router } from 'express';
import { EventController, validateEventId, validateGetEvents, validatePopularEvents } from './event.controller';
import { authenticateApiKey } from './auth.middleware';

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

// 어드민 라우트는 별도 파일로 분리됨

export default router;
