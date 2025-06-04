import { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { AdRewardsService as AdService } from '../application/ad.rewards.service';
import { CreateAdRewardDto, UpdateAdRewardDto } from '../types/ad';

export class AdRewardsController {
    constructor(private readonly adService: AdService) {}

    static validations = {
        createAdReward: [
            body('min_reward').isNumeric().withMessage('최소 보상은 숫자여야 합니다'),
            body('max_reward').isNumeric().withMessage('최대 보상은 숫자여야 합니다'),
            body('daily_limit').isInt({ min: 1 }).withMessage('일일 제한은 1 이상이어야 합니다'),
        ],
        updateAdReward: [
            body('min_reward').optional().isNumeric().withMessage('최소 보상은 숫자여야 합니다'),
            body('max_reward').optional().isNumeric().withMessage('최대 보상은 숫자여야 합니다'),
            body('daily_limit').optional().isInt({ min: 1 }).withMessage('일일 제한은 1 이상이어야 합니다'),
            body('is_active').optional().isBoolean().withMessage('활성화 여부는 불리언이어야 합니다'),
        ],
        getClaimsHistory: [
            query('startDate').isISO8601().withMessage('Invalid start date'),
            query('endDate').isISO8601().withMessage('Invalid end date'),
        ],
    };

    getAllAdRewards = async (_req: Request, res: Response): Promise<void> => {
        try {
            const adRewards = await this.adService.getAllAdRewards();
            res.json({
                success: true,
                data: adRewards
            });
        } catch (error) {
            console.error('Error in getAllAdRewards:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch ad rewards'
            });
        }
    };

    getAdRewardById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const reward = await this.adService.getAdRewardById(id);
            
            if (!reward) {
                res.status(404).json({ success: false, message: '광고 보상을 찾을 수 없습니다' });
                return;
            }

            res.json({ success: true, data: reward });
        } catch (error) {
            console.error('Error getting ad reward:', error);
            res.status(500).json({ success: false, message: '광고 보상 조회 중 오류가 발생했습니다' });
        }
    };

    createAdReward = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ success: false, errors: errors.array() });
                return;
            }

            const userId = (req as any).user.id;
            const dto: CreateAdRewardDto = req.body;
            const reward = await this.adService.createAdReward(dto, userId);

            res.status(201).json({ success: true, data: reward });
        } catch (error) {
            console.error('Error creating ad reward:', error);
            res.status(500).json({ success: false, message: '광고 보상 생성 중 오류가 발생했습니다' });
        }
    };

    updateAdReward = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ success: false, errors: errors.array() });
                return;
            }

            const { id } = req.params;
            const userId = (req as any).user.id;
            const dto: UpdateAdRewardDto = req.body;
            const reward = await this.adService.updateAdReward(id, dto, userId);

            if (!reward) {
                res.status(404).json({ success: false, message: '광고 보상을 찾을 수 없습니다' });
                return;
            }

            res.json({ success: true, data: reward });
        } catch (error) {
            console.error('Error updating ad reward:', error);
            res.status(500).json({ success: false, message: '광고 보상 수정 중 오류가 발생했습니다' });
        }
    };

    // 광고 보상 클레임 히스토리 조회
    getClaimsHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const startDate = new Date(req.query.startDate as string);
            const endDate = new Date(req.query.endDate as string);
            
            const [claims, stats] = await Promise.all([
                this.adService.getAdRewardClaims(startDate, endDate),
                this.adService.getAdRewardStats(startDate, endDate)
            ]);

            res.json({
                success: true,
                claims,
                stats
            });
        } catch (error) {
            console.error('Get claims history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch claims history'
            });
        }
    };
} 