import { Router } from 'express';
import { PortfolioController, validateUserId, validateUpdatePortfolio, validatePortfolioHistory, validatePortfolioPerformance, validateCreateSnapshot } from './portfolio.controller';

const router = Router();
const portfolioController = new PortfolioController();

/**
 * @route   GET /api/portfolio/stats
 * @desc    포트폴리오 통계 조회 (관리자)
 * @access  Private (Admin)
 */
router.get('/stats', portfolioController.getPortfolioStats);

/**
 * @route   POST /api/portfolio/snapshots/create-all
 * @desc    모든 사용자 일일 스냅샷 생성 (내부 API)
 * @access  Private (Internal)
 */
router.post('/snapshots/create-all', portfolioController.createAllDailySnapshots);

/**
 * @route   POST /api/portfolio/snapshots
 * @desc    일일 스냅샷 생성 (내부 API)
 * @access  Private (Internal)
 */
router.post('/snapshots', validateCreateSnapshot, portfolioController.createDailySnapshot);

/**
 * @route   POST /api/portfolio/update
 * @desc    포트폴리오 업데이트 (내부 API)
 * @access  Private (Internal)
 */
router.post('/update', validateUpdatePortfolio, portfolioController.updatePortfolio);

/**
 * @route   GET /api/portfolio/:user_id
 * @desc    포트폴리오 조회
 * @access  Private
 */
router.get('/:user_id', validateUserId, portfolioController.getPortfolio);

/**
 * @route   GET /api/portfolio/:user_id/history
 * @desc    포트폴리오 히스토리 조회
 * @access  Private
 */
router.get('/:user_id/history', validatePortfolioHistory, portfolioController.getPortfolioHistory);

/**
 * @route   GET /api/portfolio/:user_id/performance
 * @desc    포트폴리오 성과 분석
 * @access  Private
 */
router.get('/:user_id/performance', validatePortfolioPerformance, portfolioController.getPortfolioPerformance);

/**
 * @route   GET /api/portfolio/:user_id/rebalancing
 * @desc    포트폴리오 리밸런싱 제안
 * @access  Private
 */
router.get('/:user_id/rebalancing', validateUserId, portfolioController.getRebalancingSuggestions);

export default router;
