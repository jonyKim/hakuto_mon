import { RequestHandler } from 'express';
import { supabase } from '../infrastructure/supabase';

export class UsersController {
    getUsers: RequestHandler = async (_req, res) => {
        try {
            const { data: users, error } = await supabase
                .from('users')
                .select(`
                    id,
                    name,
                    email,
                    is_active,
                    created_at,
                    role,
                    last_login
                `)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            res.json({
                success: true,
                users
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch users',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    updateUserStatus: RequestHandler = async (req, res) => {
        try {
            const { userId } = req.params;
            const { is_active } = req.body;

            if (typeof is_active !== 'boolean') {
                res.status(400).json({
                    success: false,
                    error: 'Invalid status value'
                });
                return;
            }

            // 관리자는 자신의 상태를 변경할 수 없음
            const requestingUser = req.user;
            if (requestingUser?.id === userId) {
                res.status(403).json({
                    success: false,
                    error: 'Administrators cannot modify their own status'
                });
                return;
            }

            const { data: user, error } = await supabase
                .from('users')
                .update({
                    is_active,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                throw error;
            }

            res.json({
                success: true,
                user
            });
        } catch (error) {
            console.error('Update user status error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update user status',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    deleteUser: RequestHandler = async (req, res) => {
        try {
            const { userId } = req.params;

            // 관리자는 자신을 삭제할 수 없음
            const requestingUser = req.user;
            if (requestingUser?.id === userId) {
                res.status(403).json({
                    success: false,
                    error: 'Administrators cannot delete their own account'
                });
                return;
            }

            // 실제로 삭제하지 않고 비활성화 처리
            const { error } = await supabase
                .from('users')
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                throw error;
            }

            res.json({
                success: true,
                message: 'User successfully deactivated'
            });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete user',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
} 