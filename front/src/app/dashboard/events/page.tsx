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
  start_date?: string;
  end_date?: string;
  images?: string[];
  links?: Array<{ label: string; url: string }>;
  tags?: string[];
  view_count: number;
  like_count: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

// 폼 스키마
const eventFormSchema = z.object({
  type: z.string().min(1, 'Choose an event type'),
  title: z.string().min(1, 'Enter the title').max(255, 'The title must be less than 255 characters'),
  description: z.string().optional(),
  content: z.string().optional(),
  scope: z.string().min(1, 'Choose a scope'),
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
      
      setEvents(response.data.events);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Event list fetch failed:', error);
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
      console.error('Event creation failed:', error);
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
      console.error('Event update failed:', error);
    }
  };

  // 이벤트 삭제
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await eventApi.deleteEvent(eventId);
      fetchEvents();
    } catch (error) {
      console.error('Event deletion failed:', error);
    }
  };

  // 푸시 알림 발송
  const handleSendNotification = async (event: Event) => {
    if (!confirm(`"${event.title}" Event push notification to all users?\n\nThis action will send notifications to actual users.`)) return;

    try {
      console.log(`[Admin] Event push notification started: ${event.id} - ${event.title}`);
      
      const response = await eventApi.sendEventNotification(event.id);
      
      if (response.success) {
        alert(`✅ Push notification sent successfully!\n\nEvent: ${event.title}\nStatus: ${response.message}`);
        console.log('[Admin] Push notification sent successfully:', response);
      } else {
        throw new Error(response.message || 'Notification sending failed.');
      }
    } catch (error: any) {
      console.error('[Admin] Push notification sending failed:', error);
      alert(`❌ Push notification sending failed\n\nError: ${error.response?.data?.message || error.message || 'An unknown error occurred.'}`);
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
      startDate: event.start_date ? new Date(event.start_date).toISOString().split('T')[0] : '',
      endDate: event.end_date ? new Date(event.end_date).toISOString().split('T')[0] : '',
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
          <h1 className="text-3xl font-bold tracking-tight">Event Management</h1>
          <p className="text-muted-foreground">
            Create and manage project events and send push notifications.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Create a new event and send notifications to users.
              </DialogDescription>
            </DialogHeader>
            <EventForm 
              form={form} 
              onSubmit={handleCreateEvent}
              submitLabel="Create Event"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
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
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.reduce((sum, e) => sum + e.view_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>Filter and Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by event title, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="project_announcement">Project Announcement</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="token_listing">Token Listing</SelectItem>
                <SelectItem value="staking_event">Staking Event</SelectItem>
                <SelectItem value="nft_drop">NFT Drop</SelectItem>
                <SelectItem value="airdrop">Airdrop</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterScope} onValueChange={setFilterScope}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes</SelectItem>
                <SelectItem value="all_projects">All Projects</SelectItem>
                <SelectItem value="hakuto_token">Hakuto Token</SelectItem>
                <SelectItem value="ecosystem">Ecosystem</SelectItem>
                <SelectItem value="defi">DeFi</SelectItem>
                <SelectItem value="nft">NFT</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
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
            Manage registered events and send push notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
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
                    <TableCell>{event.view_count}</TableCell>
                    <TableCell>
                      {new Date(event.created_at).toLocaleDateString()}
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
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Edit event information.
            </DialogDescription>
          </DialogHeader>
          <EventForm 
            form={form} 
            onSubmit={handleEditEvent}
            submitLabel="Edit Event"
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
                <FormLabel>Event Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="project_announcement">Project Announcement</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="token_listing">Token Listing</SelectItem>
                    <SelectItem value="staking_event">Staking Event</SelectItem>
                    <SelectItem value="nft_drop">NFT Drop</SelectItem>
                    <SelectItem value="airdrop">Airdrop</SelectItem>
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
                <FormLabel>Scope</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Scope" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all_projects">All Projects</SelectItem>
                    <SelectItem value="hakuto_token">Hakuto Token</SelectItem>
                    <SelectItem value="ecosystem">Ecosystem</SelectItem>
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
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter the event title" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Enter the event description" {...field} />
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
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
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
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
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
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input placeholder="Tag1, Tag2, ..." {...field} />
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
                <FormLabel>Start Date</FormLabel>
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
                <FormLabel>End Date</FormLabel>
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
