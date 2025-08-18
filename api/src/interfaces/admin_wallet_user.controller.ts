import { Request, Response } from 'express';
import { WalletUserRepository } from '../infrastructure/repositories/wallet_user.repository';
import { WalletUserService } from '../application/wallet_user.service';
import { validationResult } from 'express-validator';

export class AdminWalletUserController {
    private walletUserService: WalletUserService;

    constructor() {
        const walletUserRepository = new WalletUserRepository();
        this.walletUserService = new WalletUserService(walletUserRepository);
    }

    // 모든 지갑 사용자 목록 조회 (어드민용)
    getAllWalletUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            // 유효성 검사
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { page = 1, limit = 20 } = req.query;

            const result = await this.walletUserService.getUsers(
                Number(page), 
                Number(limit)
            );

            res.status(200).json({
                success: true,
                data: {
                    users: result.data.map(user => ({
                        id: user.id,
                        wallet_address: user.walletAddress,
                        email: user.email,
                        email_verified: user.emailVerified,
                        fcm_token: user.fcmToken ? '***' : null, // 보안상 마스킹
                        created_at: user.createdAt,
                        updated_at: user.updatedAt
                    })),
                    pagination: result.pagination
                }
            });

        } catch (error) {
            console.error('Error fetching wallet users:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    };

    // 사용자 통계 조회 (어드민용)
    getUserStats = async (_req: Request, res: Response): Promise<void> => {
        try {
            const stats = await this.walletUserService.getUserStats();
            
            res.status(200).json({
                success: true,
                data: {
                    ...stats,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error fetching user stats:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    };

    // ID로 사용자 상세 조회 (어드민용)
    getUserById = async (req: Request, res: Response): Promise<void> => {
        try {
            // 유효성 검사
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { id } = req.params;

            const user = await this.walletUserService.getUserById(id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    id: user.id,
                    wallet_address: user.walletAddress,
                    email: user.email,
                    email_verified: user.emailVerified,
                    fcm_token: user.fcmToken ? '***' : null,
                    created_at: user.createdAt,
                    updated_at: user.updatedAt
                }
            });

        } catch (error) {
            console.error('Error fetching user by id:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    };

    // 지갑 주소로 사용자 조회 (어드민용)
    getUserByWalletAddress = async (req: Request, res: Response): Promise<void> => {
        try {
            // 유효성 검사
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { wallet_address } = req.params;

            const user = await this.walletUserService.getUserByWalletAddress(wallet_address);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: '지갑 사용자를 찾을 수 없습니다.'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    id: user.id,
                    wallet_address: user.walletAddress,
                    email: user.email,
                    email_verified: user.emailVerified,
                    fcm_token: user.fcmToken ? '***' : null,
                    created_at: user.createdAt,
                    updated_at: user.updatedAt
                }
            });

        } catch (error) {
            console.error('Error fetching wallet user:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    };

    // 이메일로 사용자 검색 (어드민용)
    searchUsersByEmail = async (req: Request, res: Response): Promise<void> => {
        try {
            // 유효성 검사
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { email } = req.query;

            const user = await this.walletUserService.getUserByEmail(email as string);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: '해당 이메일을 가진 사용자를 찾을 수 없습니다.'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    id: user.id,
                    wallet_address: user.walletAddress,
                    email: user.email,
                    email_verified: user.emailVerified,
                    created_at: user.createdAt,
                    updated_at: user.updatedAt
                }
            });

        } catch (error) {
            console.error('Error searching user by email:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    };

    // 사용자 정보 업데이트 (어드민용)
    updateUser = async (req: Request, res: Response): Promise<void> => {
        try {
            // 유효성 검사
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { id } = req.params;
            const { email, fcm_token, email_verified } = req.body;

            const updatedUser = await this.walletUserService.updateUser(id, {
                email,
                fcmToken: fcm_token,
                emailVerified: email_verified
            });

            if (!updatedUser) {
                res.status(500).json({
                    success: false,
                    message: '사용자 정보 업데이트에 실패했습니다.'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: '사용자 정보가 성공적으로 업데이트되었습니다.',
                data: {
                    id: updatedUser.id,
                    wallet_address: updatedUser.walletAddress,
                    email: updatedUser.email,
                    email_verified: updatedUser.emailVerified,
                    fcm_token: updatedUser.fcmToken ? '***' : null,
                    updated_at: updatedUser.updatedAt
                }
            });

        } catch (error: any) {
            console.error('Error updating user:', error);
            
            if (error.message.includes('찾을 수 없습니다') || error.message.includes('사용 중인')) {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: '서버 오류가 발생했습니다.'
                });
            }
        }
    };

    // 사용자 삭제 (어드민용)
    deleteUser = async (req: Request, res: Response): Promise<void> => {
        try {
            // 유효성 검사
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { id } = req.params;

            // 삭제 전 사용자 정보 조회
            const existingUser = await this.walletUserService.getUserById(id);
            if (!existingUser) {
                res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
                return;
            }

            // 사용자 삭제
            await this.walletUserService.deleteUser(id);

            res.status(200).json({
                success: true,
                message: '사용자가 성공적으로 삭제되었습니다.',
                data: {
                    deleted_user_id: id,
                    wallet_address: existingUser.walletAddress
                }
            });

        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    };
}
