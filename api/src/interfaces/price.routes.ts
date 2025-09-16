import { Router } from 'express';
import { PriceController } from './price.controller';
import { authenticateAdmin, requireAdminGrade, authenticateApiKey } from './auth.middleware';

const router = Router();
const priceController = new PriceController();

// =============================================================================
// 공개 API (모바일 앱용) - 인증 없음 또는 API 키 인증
// =============================================================================

/**
 * @route   GET /api/price/hktm/current
 * @desc    HKTM 현재 가격 조회 (공개)
 * @access  Public
 */
router.get('/hktm/current', async (req, res) => {
  await priceController.getCurrentHktmPrice(req, res);
});

/**
 * @route   GET /api/price/hktm/history
 * @desc    HKTM 가격 히스토리 조회 (공개)
 * @access  Public
 */
router.get('/hktm/history', async (req, res) => {
  await priceController.getHktmPriceHistory(req, res);
});

/**
 * @route   GET /api/price/hktm/stats
 * @desc    HKTM 가격 통계 조회 (공개)
 * @access  Public
 */
router.get('/hktm/stats', async (req, res) => {
  await priceController.getHktmPriceStats(req, res);
});

/**
 * @route   GET /api/price/mexc/status
 * @desc    MEXC API 상태 확인 (공개)
 * @access  Public
 */
router.get('/mexc/status', async (req, res) => {
  await priceController.getMexcApiStatus(req, res);
});

// =============================================================================
// 어드민 API - JWT 인증 필요
// =============================================================================

/**
 * @route   POST /api/price/hktm/update
 * @desc    수동 가격 업데이트 (어드민)
 * @access  Private (Admin)
 */
router.post('/hktm/update', authenticateAdmin, requireAdminGrade, async (req, res) => {
  await priceController.manualPriceUpdate(req, res);
});

/**
 * @route   GET /api/price/collection/status
 * @desc    가격 수집 상태 조회 (어드민)
 * @access  Private (Admin)
 */
router.get('/collection/status', authenticateAdmin, requireAdminGrade, async (req, res) => {
  await priceController.getCollectionStatus(req, res);
});

/**
 * @route   GET /api/price/scheduler/status
 * @desc    스케줄러 상태 조회 (어드민)
 * @access  Private (Admin)
 */
router.get('/scheduler/status', authenticateAdmin, requireAdminGrade, async (req, res) => {
  await priceController.getSchedulerStatus(req, res);
});

/**
 * @route   POST /api/price/scheduler/execute
 * @desc    스케줄러 수동 실행 (어드민)
 * @access  Private (Admin)
 */
router.post('/scheduler/execute', authenticateAdmin, requireAdminGrade, async (req, res) => {
  await priceController.executeScheduler(req, res);
});

export default router;
