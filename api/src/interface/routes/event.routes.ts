import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { EventService } from '../../application/event.service';
import { EventRepository } from '../../infrastructure/repositories/event.repository';
import { AlertRuleRepository } from '../../infrastructure/repositories/alert_rule.repository';
import { NotificationService } from '../../application/notification.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = Router();

// 의존성 주입
const eventRepository = new EventRepository();
const alertRuleRepository = new AlertRuleRepository();
const notificationService = new NotificationService();
const eventService = new EventService(eventRepository, alertRuleRepository, notificationService);
const eventController = new EventController(eventService, notificationService, alertRuleRepository);

// 공개 API (모바일 앱용)
router.get('/events', (req, res) => eventController.getPublicEvents(req, res));
router.get('/events/:id', (req, res) => eventController.getEventById(req, res));

// 어드민 API (인증 필요)
router.use('/admin/events', authMiddleware, adminMiddleware);

// 이벤트 CRUD
router.post('/admin/events', (req, res) => eventController.createEvent(req, res));
router.get('/admin/events', (req, res) => eventController.getEvents(req, res));
router.get('/admin/events/types', (req, res) => eventController.getEventTypes(req, res));
router.get('/admin/events/scopes', (req, res) => eventController.getEventScopes(req, res));
router.get('/admin/events/:id', (req, res) => eventController.getEventById(req, res));
router.put('/admin/events/:id', (req, res) => eventController.updateEvent(req, res));
router.delete('/admin/events/:id', (req, res) => eventController.deleteEvent(req, res));

// 이벤트 알림 발송
router.post('/admin/events/:id/send-notification', (req, res) => eventController.sendEventNotification(req, res));

export default router;
