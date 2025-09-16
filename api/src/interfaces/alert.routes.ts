import { Router } from 'express';
import { AlertController, validateCreateAlert, validateUpdateAlert, validateAlertId, validateGetAlerts, validateAlertStats } from './alert.controller';

const router = Router();
const alertController = new AlertController();

/**
 * @route   POST /api/alerts
 * @desc    알림 규칙 생성
 * @access  Private
 */
router.post('/', validateCreateAlert, alertController.createAlert);

/**
 * @route   GET /api/alerts
 * @desc    알림 규칙 목록 조회
 * @access  Private
 */
router.get('/', validateGetAlerts, alertController.getAlerts);

/**
 * @route   GET /api/alerts/stats
 * @desc    알림 통계 조회
 * @access  Private
 */
router.get('/stats', validateAlertStats, alertController.getAlertStats);

/**
 * @route   GET /api/alerts/:alert_id
 * @desc    알림 규칙 상세 조회
 * @access  Private
 */
router.get('/:alert_id', validateAlertId, alertController.getAlert);

/**
 * @route   PUT /api/alerts/:alert_id
 * @desc    알림 규칙 수정
 * @access  Private
 */
router.put('/:alert_id', validateUpdateAlert, alertController.updateAlert);

/**
 * @route   DELETE /api/alerts/:alert_id
 * @desc    알림 규칙 삭제
 * @access  Private
 */
router.delete('/:alert_id', validateAlertId, alertController.deleteAlert);

/**
 * @route   POST /api/alerts/:alert_id/test
 * @desc    테스트 알림 발송
 * @access  Private
 */
router.post('/:alert_id/test', validateAlertId, alertController.sendTestNotification);

export default router;
