"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Users, 
  UserCheck, 
  UserX, 
  Calendar,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { walletUsersApi, WalletUser, WalletUserStats } from '@/lib/api/wallet-users';
import { toast } from 'sonner';

export default function WalletUsersPage() {
  const [users, setUsers] = useState<WalletUser[]>([]);
  const [stats, setStats] = useState<WalletUserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<WalletUser | null>(null);

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 통계 데이터 로드
      const statsResponse = await walletUsersApi.getStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // 사용자 목록 로드
      const params = {
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
        verified: verificationFilter === 'all' ? undefined : verificationFilter === 'verified'
      };

      const usersResponse = await walletUsersApi.getUsers(params);
      if (usersResponse.success) {
        // 백엔드 응답 구조에 따라 처리
        const userData = Array.isArray(usersResponse.data) 
          ? usersResponse.data 
          : (usersResponse.data as { users: WalletUser[] }).users;
        setUsers(userData);
        setTotalPages(usersResponse.pagination?.pages || usersResponse.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load wallet users data:', error);
      toast.error('Failed to load wallet users data.');
    } finally {
      setLoading(false);
    }
  };

  // 검색 실행
  const handleSearch = async () => {
    setCurrentPage(1);
    await loadData();
  };

  // 사용자 삭제
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await walletUsersApi.deleteUser(userId);
      if (response.success) {
        toast.success('User deleted successfully.');
        await loadData();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user.');
    }
  };

  // 인증 상태 토글
  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await walletUsersApi.updateVerificationStatus(userId, !currentStatus);
      if (response.success) {
        toast.success('Verification status updated successfully.');
        await loadData();
      }
    } catch (error) {
      console.error('Failed to update verification status:', error);
      toast.error('Failed to update verification status.');
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, verificationFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet Users</h1>
          <p className="text-muted-foreground">
            Wallet user management and email verification status check
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.totalUsers ?? 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{(stats.verifiedUsers ?? 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unverified Users</CardTitle>
              <UserX className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{(stats.unverifiedUsers ?? 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today Registrations</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{(stats.todayRegistrations ?? 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>User Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by wallet address or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 사용자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            Total {users.length} users (Page {currentPage} / {totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wallet Address</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Verification Status</TableHead>
                <TableHead>Joined At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-sm">
                    {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.email_verified ? "default" : "secondary"}>
                      {user.email_verified ? "Verified" : "Unverified"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={user.email_verified ? "secondary" : "default"}
                        onClick={() => handleToggleVerification(user.id, user.email_verified)}
                      >
                        {user.email_verified ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 사용자 상세 모달 (간단 구현) */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>User Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Wallet Address</label>
                <p className="font-mono text-sm">{selectedUser.wallet_address}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p>{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Verification Status</label>
                <p>
                  <Badge variant={selectedUser.email_verified ? "default" : "secondary"}>
                    {selectedUser.email_verified ? "Verified" : "Unverified"}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Joined At</label>
                <p>{new Date(selectedUser.created_at).toLocaleString('ko-KR')}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Last Updated At</label>
                <p>{new Date(selectedUser.updated_at).toLocaleString('ko-KR')}</p>
              </div>
              <Button onClick={() => setSelectedUser(null)} className="w-full">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
