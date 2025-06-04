import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { MobileApiService } from '../../application/mobile.service';
import { ApiException, ErrorCode } from '../../types/errors';

export class MobileApiController {
    constructor(private readonly mobileApiService: MobileApiService) {}

    static validations = {
        claimMissionReward: [
            body('walletAddress').isString().notEmpty().withMessage('지갑 주소는 필수입니다'),
            body('missionId').isUUID().withMessage('올바른 미션 ID가 필요합니다'),
            body('steps').isInt({ min: 0 }).withMessage('걸음수는 0 이상이어야 합니다'),
            body('rewards').isFloat({ min: 0 }).withMessage('보상은 0 이상이어야 합니다'),
            body('date').isISO8601().withMessage('올바른 날짜 형식이 필요합니다'),
        ]
    };

    getActiveMissionRewards = async (_req: Request, res: Response): Promise<void> => {
        try {
            const missions = await this.mobileApiService.getActiveMissionRewards();
            
            res.json({
                success: true,
                data: missions.map(mission => ({
                    id: mission.id,
                    steps: mission.steps,
                    reward: mission.reward,
                    isActive: mission.is_active
                }))
            });
        } catch (error) {
            console.error('Error fetching active mission rewards:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            res.status(500).json({
                success: false,
                code: ErrorCode.UNKNOWN_ERROR,
                message: errorMessage
            });
        }
    };

    claimMissionReward = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    code: ErrorCode.UNKNOWN_ERROR,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }

            const claim = await this.mobileApiService.claimMissionReward(req.body);
            
            res.status(201).json({
                success: true,
                data: {
                    claimId: claim.id,
                    missionId: claim.mission_id,
                    claimStatus: claim.claim_status,
                    claimedAt: claim.claimed_at
                }
            });
        } catch (error) {
            console.error('Error claiming mission reward:', error);
            
            if (error instanceof ApiException) {
                res.status(error.status).json({
                    success: false,
                    code: error.code,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    code: ErrorCode.UNKNOWN_ERROR,
                    message: error instanceof Error ? error.message : 'Unknown error occurred'
                });
            }
        }
    };
} 