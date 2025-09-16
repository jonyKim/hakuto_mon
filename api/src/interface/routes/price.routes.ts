import { Router } from 'express';
import { PriceController } from '../controllers/price.controller';

const router = Router();
const priceController = new PriceController();

/**
 * HKTM 가격 관련 API 라우트
 */

// HKTM 현재 가격 조회
router.get('/hktm/current', async (req, res) => {
  await priceController.getCurrentHktmPrice(req, res);
});

// HKTM 가격 히스토리 조회
router.get('/hktm/history', async (req, res) => {
  await priceController.getHktmPriceHistory(req, res);
});

// HKTM 가격 통계 조회
router.get('/hktm/stats', async (req, res) => {
  await priceController.getHktmPriceStats(req, res);
});

// 수동 가격 업데이트
router.post('/hktm/update', async (req, res) => {
  await priceController.manualPriceUpdate(req, res);
});

/**
 * 가격 수집 시스템 관련 API 라우트
 */

// 가격 수집 상태 조회
router.get('/collection/status', async (req, res) => {
  await priceController.getCollectionStatus(req, res);
});

// 스케줄러 상태 조회
router.get('/scheduler/status', async (req, res) => {
  await priceController.getSchedulerStatus(req, res);
});

// 스케줄러 수동 실행
router.post('/scheduler/execute', async (req, res) => {
  await priceController.executeScheduler(req, res);
});

/**
 * 외부 API 상태 확인
 */

// MEXC API 상태 확인
router.get('/mexc/status', async (req, res) => {
  await priceController.getMexcApiStatus(req, res);
});

export default router;
