import { Request, Response } from 'express';
import { MissionClaimsService } from '../application/mission.claims.service';
import { MissionRewardClaimStatus } from '../types/mission.claim';
import { isValidUUID, isValidDate } from '../utils/validation';

export class MissionClaimController {
    constructor(private readonly missionClaimsService: MissionClaimsService) {}

    getAllClaims = async (_req: Request, res: Response): Promise<void> => {
        try {
            const claims = await this.missionClaimsService.getAllClaims();
            res.json({
                success: true,
                data: claims
            });
        } catch (error) {
            console.error('Error in getAllClaims:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve all claims'
            });
        }
    };
    getClaimsHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { startDate, endDate } = req.query;

            // 날짜 범위가 없는 경우 전체 조회
            if (!startDate && !endDate) {
                const claims = await this.missionClaimsService.getAllClaims();
                res.json({
                    success: true,
                    data: claims
                });
                return;
            }

            // 날짜 범위 유효성 검사
            if ((!startDate && endDate) || (startDate && !endDate) || 
                !isValidDate(startDate as string) || !isValidDate(endDate as string)) {
                res.status(400).json({ 
                    success: false,
                    error: 'Invalid date format. Use YYYY-MM-DD format or omit both dates for all claims.' 
                });
                return;
            }

            const claims = await this.missionClaimsService.getClaimsByDateRange(
                new Date(startDate as string),
                new Date(endDate as string)
            );

            res.json({
                success: true,
                data: claims
            });
        } catch (error) {
            console.error('Error in getClaimsHistory:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to retrieve claims history' 
            });
        }
    };

    getClaimById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            if (!isValidUUID(id)) {
                res.status(400).json({ 
                    success: false,
                    error: 'Invalid claim ID format' 
                });
                return;
            }

            const claim = await this.missionClaimsService.getClaimById(id);
            if (!claim) {
                res.status(404).json({ 
                    success: false,
                    error: 'Claim not found' 
                });
                return;
            }

            res.json({
                success: true,
                data: claim
            });
        } catch (error) {
            console.error('Error in getClaimById:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to retrieve claim' 
            });
        }
    };

    updateClaimStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { status, transactionHash } = req.body;

            if (!isValidUUID(id)) {
                res.status(400).json({ 
                    success: false,
                    error: 'Invalid claim ID format' 
                });
                return;
            }

            if (!Object.values(MissionRewardClaimStatus).includes(status)) {
                res.status(400).json({ 
                    success: false,
                    error: 'Invalid status value' 
                });
                return;
            }

            if (status === 'COMPLETED' && !transactionHash?.match(/^0x[a-fA-F0-9]{64}$/)) {
                res.status(400).json({ 
                    success: false,
                    error: 'Invalid transaction hash format' 
                });
                return;
            }

            const updatedClaim = await this.missionClaimsService.updateClaimStatus(
                id,
                status,
                transactionHash
            );

            res.json({
                success: true,
                data: updatedClaim
            });
        } catch (error: any) {
            console.error('Error in updateClaimStatus:', error);
            if (error.message === 'Claim not found') {
                res.status(404).json({ 
                    success: false,
                    error: error.message 
                });
                return;
            }
            if (error.message === 'Cannot modify completed claim') {
                res.status(400).json({ 
                    success: false,
                    error: error.message 
                });
                return;
            }
            res.status(500).json({ 
                success: false,
                error: 'Failed to update claim status' 
            });
        }
    };

    getClaimsStatistics = async (req: Request, res: Response): Promise<void> => {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate || !isValidDate(startDate as string) || !isValidDate(endDate as string)) {
                res.status(400).json({ 
                    success: false,
                    error: 'Invalid date format. Use YYYY-MM-DD format.' 
                });
                return;
            }

            const statistics = await this.missionClaimsService.getClaimsStatistics(
                new Date(startDate as string),
                new Date(endDate as string)
            );

            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            console.error('Error in getClaimsStatistics:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to retrieve claims statistics' 
            });
        }
    };
} 