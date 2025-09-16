'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Search, Send, Edit, Trash2, Eye, Calendar, Users, TrendingUp } from 'lucide-react';
import { eventApi } from '@/lib/api/events';

// 이벤트 타입 정의
interface Event {
  id: string;
  type: string;
  title: string;
  description?: string;
  content?: string;
  scope: string;
  status: 'upcoming' | 'active' | 'ended';
  priority: 'low' | 'medium' | 'high';
  startDate?: string;
  endDate?: string;
  images?: string[];
  links?: Array<{ label: string; url: string }>;
  tags?: string[];
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

// 폼 스키마
const eventFormSchema = z.object({
  type: z.string().min(1, '이벤트 타입을 선택해주세요'),
  title: z.string().min(1, '제목을 입력해주세요').max(255, '제목은 255자 이하로 입력해주세요'),
  description: z.string().optional(),
  content: z.string().optional(),
  scope: z.string().min(1, '범위를 선택해주세요'),
  status: z.enum(['upcoming', 'active', 'ended']).default('upcoming'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tags: z.string().optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterScope, setFilterScope] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      status: 'upcoming',
      priority: 'medium',
    },
  });

  // 이벤트 목록 조회
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventApi.getEvents({
        page: currentPage,
        limit: 10,
        type: filterType && filterType !== 'all' ? filterType : undefined,
        scope: filterScope && filterScope !== 'all' ? filterScope : undefined,
        status: filterStatus && filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined,
      });
      
      setEvents(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('이벤트 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 이벤트 생성
  const handleCreateEvent = async (data: EventFormData) => {
    try {
      const eventData = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
      };

      await eventApi.createEvent(eventData);
      setIsCreateDialogOpen(false);
      form.reset();
      fetchEvents();
    } catch (error) {
      console.error('이벤트 생성 실패:', error);
    }
  };

  // 이벤트 수정
  const handleEditEvent = async (data: EventFormData) => {
    if (!selectedEvent) return;

    try {
      const eventData = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
      };

      await eventApi.updateEvent(selectedEvent.id, eventData);
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      form.reset();
      fetchEvents();
    } catch (error) {
      console.error('이벤트 수정 실패:', error);
    }
  };

  // 이벤트 삭제
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('정말로 이 이벤트를 삭제하시겠습니까?')) return;

    try {
      await eventApi.deleteEvent(eventId);
      fetchEvents();
    } catch (error) {
      console.error('이벤트 삭제 실패:', error);
    }
  };

  // 푸시 알림 발송
  const handleSendNotification = async (event: Event) => {
    if (!confirm(`"${event.title}" 이벤트에 대한 푸시 알림을 발송하시겠습니까?`)) return;

    try {
      const response = await eventApi.sendNotification(event.id, {
        customMessage: event.description,
        targetScope: event.scope,
      });
      
      alert(`알림 발송 완료!\n성공: ${response.data.successCount}명\n실패: ${response.data.failCount}명`);
    } catch (error) {
      console.error('푸시 알림 발송 실패:', error);
      alert('푸시 알림 발송에 실패했습니다.');
    }
  };

  // 편집 모드 시작
  const startEdit = (event: Event) => {
    setSelectedEvent(event);
    form.reset({
      type: event.type,
      title: event.title,
      description: event.description || '',
      content: event.content || '',
      scope: event.scope,
      status: event.status,
      priority: event.priority,
      startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
      endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
      tags: event.tags?.join(', ') || '',
    });
    setIsEditDialogOpen(true);
  };

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 우선순위별 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentPage, filterType, filterScope, filterStatus, searchTerm]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">이벤트 관리</h1>
          <p className="text-muted-foreground">
            프로젝트 이벤트를 생성하고 관리하며 푸시 알림을 발송하세요.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              새 이벤트 생성
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 이벤트 생성</DialogTitle>
              <DialogDescription>
                새로운 이벤트를 생성하고 사용자들에게 알림을 보낼 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <EventForm 
              form={form} 
              onSubmit={handleCreateEvent}
              submitLabel="이벤트 생성"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 이벤트</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행중</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">예정</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.status === 'upcoming').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 조회수</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.reduce((sum, e) => sum + e.viewCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>필터 및 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="이벤트 제목, 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="이벤트 타입" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 타입</SelectItem>
                <SelectItem value="project_announcement">프로젝트 발표</SelectItem>
                <SelectItem value="partnership">파트너십</SelectItem>
                <SelectItem value="token_listing">토큰 상장</SelectItem>
                <SelectItem value="staking_event">스테이킹 이벤트</SelectItem>
                <SelectItem value="nft_drop">NFT 드롭</SelectItem>
                <SelectItem value="airdrop">에어드롭</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterScope} onValueChange={setFilterScope}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="범위" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 범위</SelectItem>
                <SelectItem value="all_projects">모든 프로젝트</SelectItem>
                <SelectItem value="hakuto_token">하쿠토 토큰</SelectItem>
                <SelectItem value="ecosystem">생태계</SelectItem>
                <SelectItem value="defi">DeFi</SelectItem>
                <SelectItem value="nft">NFT</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="upcoming">예정</SelectItem>
                <SelectItem value="active">진행중</SelectItem>
                <SelectItem value="ended">종료</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 이벤트 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>이벤트 목록</CardTitle>
          <CardDescription>
            등록된 이벤트를 관리하고 푸시 알림을 발송할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제목</TableHead>
                  <TableHead>타입</TableHead>
                  <TableHead>범위</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>우선순위</TableHead>
                  <TableHead>조회수</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.type}</TableCell>
                    <TableCell>{event.scope}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(event.priority)}>
                        {event.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{event.viewCount}</TableCell>
                    <TableCell>
                      {new Date(event.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendNotification(event)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 편집 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>이벤트 수정</DialogTitle>
            <DialogDescription>
              이벤트 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <EventForm 
            form={form} 
            onSubmit={handleEditEvent}
            submitLabel="수정 완료"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 이벤트 폼 컴포넌트
function EventForm({ 
  form, 
  onSubmit, 
  submitLabel 
}: { 
  form: any; 
  onSubmit: (data: EventFormData) => void;
  submitLabel: string;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이벤트 타입</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="타입 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="project_announcement">프로젝트 발표</SelectItem>
                    <SelectItem value="partnership">파트너십</SelectItem>
                    <SelectItem value="token_listing">토큰 상장</SelectItem>
                    <SelectItem value="staking_event">스테이킹 이벤트</SelectItem>
                    <SelectItem value="nft_drop">NFT 드롭</SelectItem>
                    <SelectItem value="airdrop">에어드롭</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>범위</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="범위 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all_projects">모든 프로젝트</SelectItem>
                    <SelectItem value="hakuto_token">하쿠토 토큰</SelectItem>
                    <SelectItem value="ecosystem">생태계</SelectItem>
                    <SelectItem value="defi">DeFi</SelectItem>
                    <SelectItem value="nft">NFT</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제목</FormLabel>
              <FormControl>
                <Input placeholder="이벤트 제목을 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>설명</FormLabel>
              <FormControl>
                <Input placeholder="이벤트 설명을 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>상태</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="upcoming">예정</SelectItem>
                    <SelectItem value="active">진행중</SelectItem>
                    <SelectItem value="ended">종료</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>우선순위</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">낮음</SelectItem>
                    <SelectItem value="medium">보통</SelectItem>
                    <SelectItem value="high">높음</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>태그</FormLabel>
                <FormControl>
                  <Input placeholder="태그1, 태그2, ..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>시작일</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>종료일</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Form>
  );
}
