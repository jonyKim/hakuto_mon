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
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  RefreshCw,
  Send,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { 
  emailVerificationApi, 
  EmailVerificationAttempt, 
  EmailVerificationStats 
} from '@/lib/api/email-verification';
import { toast } from 'sonner';

export default function EmailVerificationPage() {
  const [stats, setStats] = useState<EmailVerificationStats | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<EmailVerificationAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  
  // 인증 코드 발송 폼
  const [sendForm, setSendForm] = useState({
    userId: '',
    email: ''
  });

  // 인증 코드 검증 폼
  const [verifyForm, setVerifyForm] = useState({
    verificationCode: ''
  });

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 통계 데이터 로드
      const statsResponse = await emailVerificationApi.getStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // 최근 인증 시도 로드
      const attemptsResponse = await emailVerificationApi.getRecentAttempts(50);
      if (attemptsResponse.success) {
        setRecentAttempts(attemptsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load email verification data:', error);
      toast.error('Failed to load email verification data.');
    } finally {
      setLoading(false);
    }
  };

  // 인증 코드 발송
  const handleSendCode = async () => {
    if (!sendForm.userId || !sendForm.email) {
      toast.error('Please enter both user ID and email.');
      return;
    }

    try {
      setSendingCode(true);
      const response = await emailVerificationApi.sendVerificationCode({
        user_id: sendForm.userId,
        email: sendForm.email
      });

      if (response.success) {
        toast.success('Verification code sent successfully.');
        setSendForm({ userId: '', email: '' });
        await loadData(); // 데이터 새로고침
      } else {
        toast.error(response.message || 'Failed to send verification code.');
      }
    } catch (error) {
      console.error('Failed to send verification code:', error);
      toast.error('Failed to send verification code.');
    } finally {
      setSendingCode(false);
    }
  };

  // 인증 코드 검증
  const handleVerifyCode = async () => {
    if (!verifyForm.verificationCode) {
      toast.error('Please enter the verification code.');
      return;
    }

    try {
      setVerifyingCode(true);
      const response = await emailVerificationApi.verifyCode({
        verification_code: verifyForm.verificationCode
      });

      if (response.success) {
        toast.success('Email verification completed.');
        setVerifyForm({ verificationCode: '' });
        await loadData(); // 데이터 새로고침
      } else {
        toast.error(response.message || '인증 코드가 유효하지 않습니다.');
      }
    } catch (error) {
      console.error('Failed to verify code:', error);
      toast.error('Failed to verify code.');
    } finally {
      setVerifyingCode(false);
    }
  };

  // 만료된 인증 시도 정리
  const handleCleanupExpired = async () => {
    if (!confirm('Do you want to clean up expired verification attempts?')) return;

    try {
      const response = await emailVerificationApi.cleanupExpiredAttempts();
      if (response.success) {
        toast.success('Expired verification attempts cleaned up.');
        await loadData();
      }
    } catch (error) {
      console.error('Failed to cleanup expired attempts:', error);
      toast.error('Failed to clean up expired attempts.');
    }
  };

  // 인증 상태 뱃지
  const getStatusBadge = (attempt: EmailVerificationAttempt) => {
    if (attempt.isVerified) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>;
    }
    
    const isExpired = new Date(attempt.expiresAt) < new Date();
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    return <Badge variant="secondary">Pending</Badge>;
  };

  useEffect(() => {
    loadData();
  }, []);

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
          <h1 className="text-3xl font-bold tracking-tight">Email Verification</h1>
          <p className="text-muted-foreground">
            Email verification management and statistics
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCleanupExpired} variant="outline">
            <Trash2 className="h-4 w-4 mr-2" />
            Clean up expired items
          </Button>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttempts.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Verifications</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.successfulVerifications.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failedAttempts.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.successRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 인증 코드 발송 */}
      <Card>
        <CardHeader>
          <CardTitle>Send Verification Code</CardTitle>
          <CardDescription>
            Send verification code to a user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="User ID"
              value={sendForm.userId}
              onChange={(e) => setSendForm({ ...sendForm, userId: e.target.value })}
            />
            <Input
              placeholder="Email Address"
              type="email"
              value={sendForm.email}
              onChange={(e) => setSendForm({ ...sendForm, email: e.target.value })}
            />
            <Button onClick={handleSendCode} disabled={sendingCode}>
              {sendingCode ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 인증 코드 검증 */}
      <Card>
        <CardHeader>
          <CardTitle>Verify Verification Code</CardTitle>
          <CardDescription>
            Verify the received verification code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="6-digit verification code"
              value={verifyForm.verificationCode}
              onChange={(e) => setVerifyForm({ ...verifyForm, verificationCode: e.target.value })}
              maxLength={6}
            />
            <Button onClick={handleVerifyCode} disabled={verifyingCode}>
              {verifyingCode ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Verify
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 최근 인증 시도 */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Verification Attempts</CardTitle>
          <CardDescription>
            Recent 50 email verification attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Expiration Time</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAttempts.map((attempt) => (
                <TableRow key={attempt.id}>
                  <TableCell>{attempt.email}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {attempt.userId.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(attempt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {attempt.attemptsCount}
                      {attempt.attemptsCount >= 3 && (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {new Date(attempt.expiresAt).toLocaleString('ko-KR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(attempt.createdAt).toLocaleString('ko-KR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {recentAttempts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              There are no verification attempts.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
