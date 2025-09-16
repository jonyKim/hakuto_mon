import { Router } from 'express';
import { TelegramController, validateGenerateCode, validateUserId, validateSendMessage, validateBulkMessage, validateBroadcast } from './telegram.controller';

const router = Router();
const telegramController = new TelegramController();

/**
 * @route   POST /api/telegram/generate-code
 * @desc    텔레그램 연결 코드 생성
 * @access  Private
 */
router.post('/generate-code', validateGenerateCode, telegramController.generateConnectionCode);

/**
 * @route   GET /api/telegram/stats
 * @desc    텔레그램 연결 통계 조회 (관리자)
 * @access  Private (Admin)
 */
router.get('/stats', telegramController.getConnectionStats);

/**
 * @route   POST /api/telegram/send
 * @desc    텔레그램 메시지 발송 (내부 API)
 * @access  Private (Internal)
 */
router.post('/send', validateSendMessage, telegramController.sendMessage);

/**
 * @route   POST /api/telegram/send-bulk
 * @desc    텔레그램 일괄 메시지 발송 (내부 API)
 * @access  Private (Internal)
 */
router.post('/send-bulk', validateBulkMessage, telegramController.sendBulkMessage);

/**
 * @route   POST /api/telegram/broadcast
 * @desc    텔레그램 브로드캐스트 (내부 API)
 * @access  Private (Internal)
 */
router.post('/broadcast', validateBroadcast, telegramController.broadcastMessage);

/**
 * @route   POST /api/telegram/cleanup
 * @desc    만료된 연결 코드 정리 (내부 API)
 * @access  Private (Internal)
 */
router.post('/cleanup', telegramController.cleanupExpiredCodes);

/**
 * @route   GET /api/telegram/status/:user_id
 * @desc    텔레그램 연결 상태 확인
 * @access  Private
 */
router.get('/status/:user_id', validateUserId, telegramController.getConnectionStatus);

/**
 * @route   DELETE /api/telegram/disconnect/:user_id
 * @desc    텔레그램 연결 해제
 * @access  Private
 */
router.delete('/disconnect/:user_id', validateUserId, telegramController.disconnectUser);

/**
 * @route   POST /api/telegram/webhook
 * @desc    텔레그램 봇 웹훅 (내부 API)
 * @access  Public (Telegram)
 */
router.post('/webhook', telegramController.handleWebhook);

export default router;
