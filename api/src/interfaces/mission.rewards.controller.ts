import { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { MissionRewardsService } from '../application/mission.rewards.service';
import { CreateMissionRewardDto, UpdateMissionRewardDto } from '../types/mission';

export class MissionRewardsController {
    constructor(private readonly missionRewardService: MissionRewardsService) {}

    static validations = {
        createMissionReward: [
            body('steps').isInt({ min: 1 }).withMessage('걸음 수는 1 이상이어야 합니다'),
            body('reward').isNumeric().withMessage('보상은 숫자여야 합니다'),
        ],
        updateMissionReward: [
            body('steps').optional().isInt({ min: 1 }).withMessage('걸음 수는 1 이상이어야 합니다'),
            body('reward').optional().isNumeric().withMessage('보상은 숫자여야 합니다'),
            body('is_active').optional().isBoolean().withMessage('활성화 여부는 불리언이어야 합니다'),
        ],
        getClaimsHistory: [
            query('startDate').isISO8601().withMessage('Invalid start date'),
            query('endDate').isISO8601().withMessage('Invalid end date'),
        ],
    };

    getAllMissionRewards = async (_req: Request, res: Response): Promise<void> => {
        try {
            const rewards = await this.missionRewardService.getAllMissionRewards();
            res.json({ success: true, data: rewards });
        } catch (error) {
            console.error('Error getting mission rewards:', error);
            res.status(500).json({ success: false, message: '미션 보상 목록 조회 중 오류가 발생했습니다' });
        }
    };

    getMissionRewardById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const reward = await this.missionRewardService.getMissionRewardById(id);
            
            if (!reward) {
                res.status(404).json({ success: false, message: '미션 보상을 찾을 수 없습니다' });
                return;
            }

            res.json({ success: true, data: reward });
        } catch (error) {
            console.error('Error getting mission reward:', error);
            res.status(500).json({ success: false, message: '미션 보상 조회 중 오류가 발생했습니다' });
        }
    };

    createMissionReward = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ success: false, errors: errors.array() });
                return;
            }

            const userId = (req as any).user.id;
            const dto: CreateMissionRewardDto = req.body;
            const reward = await this.missionRewardService.createMissionReward(dto, userId);

            res.status(201).json({ success: true, data: reward });
        } catch (error) {
            console.error('Error creating mission reward:', error);
            res.status(500).json({ success: false, message: '미션 보상 생성 중 오류가 발생했습니다' });
        }
    };

    updateMissionReward = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ success: false, errors: errors.array() });
                return;
            }

            const { id } = req.params;
            const userId = (req as any).user.id;
            const dto: UpdateMissionRewardDto = req.body;
            const reward = await this.missionRewardService.updateMissionReward(id, dto, userId);

            if (!reward) {
                res.status(404).json({ success: false, message: '미션 보상을 찾을 수 없습니다' });
                return;
            }

            res.json({ success: true, data: reward });
        } catch (error) {
            console.error('Error updating mission reward:', error);
            res.status(500).json({ success: false, message: '미션 보상 수정 중 오류가 발생했습니다' });
        }
    };

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
                this.missionRewardService.getMissionRewardClaims(startDate, endDate),
                this.missionRewardService.getMissionRewardStats(startDate, endDate)
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