import { Repository, Between } from 'typeorm';
import { AppDataSource } from '../database';
import { Event } from '../../domain/entities/event.entity';

export class EventRepository {
    private repository: Repository<Event>;

    constructor() {
        this.repository = AppDataSource.getRepository(Event);
    }

    async findById(id: string): Promise<Event | null> {
        return await this.repository.findOne({
            where: { id }
        });
    }

    async findAll(
        type?: string, 
        scope?: string, 
        status?: string,
        page: number = 1,
        limit: number = 20,
        search?: string
    ): Promise<{ events: Event[], total: number }> {
        const queryBuilder = this.repository.createQueryBuilder('event');

        // 기본 필터링
        if (type) {
            queryBuilder.andWhere('event.type = :type', { type });
        }
        if (scope) {
            queryBuilder.andWhere('event.scope = :scope', { scope });
        }
        if (status) {
            queryBuilder.andWhere('event.status = :status', { status });
        }

        // 검색 기능
        if (search) {
            queryBuilder.andWhere(
                '(event.title LIKE :search OR event.description LIKE :search OR event.content LIKE :search)',
                { search: `%${search}%` }
            );
        }

        // 정렬 및 페이징
        queryBuilder
            .orderBy('event.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [events, total] = await queryBuilder.getManyAndCount();

        return { events, total };
    }

    async findActiveEvents(): Promise<Event[]> {
        return await this.repository.find({
            where: { status: 'active' },
            order: { startDate: 'ASC' }
        });
    }

    async findUpcomingEvents(): Promise<Event[]> {
        return await this.repository.find({
            where: { status: 'upcoming' },
            order: { startDate: 'ASC' }
        });
    }

    async findEventsByScope(scope: 'all_projects' | 'hakuto_token' | 'ecosystem' | 'defi' | 'nft'): Promise<Event[]> {
        return await this.repository.find({
            where: { scope },
            order: { createdAt: 'DESC' }
        });
    }

    async findEventsByType(type: 'project_announcement' | 'partnership' | 'token_listing' | 'staking_event' | 'nft_drop' | 'airdrop'): Promise<Event[]> {
        return await this.repository.find({
            where: { type },
            order: { createdAt: 'DESC' }
        });
    }

    async findEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
        return await this.repository.find({
            where: {
                startDate: Between(startDate, endDate)
            },
            order: { startDate: 'ASC' }
        });
    }

    async findRecentEvents(limit: number = 10): Promise<Event[]> {
        return await this.repository.find({
            order: { createdAt: 'DESC' },
            take: limit
        });
    }

    async findPopularEvents(limit: number = 10): Promise<Event[]> {
        return await this.repository.find({
            order: { 
                viewCount: 'DESC',
                likeCount: 'DESC'
            },
            take: limit
        });
    }

    async create(eventData: Partial<Event>): Promise<Event> {
        const event = this.repository.create(eventData);
        return await this.repository.save(event);
    }

    async update(id: string, eventData: Partial<Event>): Promise<Event | null> {
        await this.repository.update(id, eventData);
        return await this.findById(id);
    }

    async updateStatus(id: string, status: 'upcoming' | 'active' | 'ended'): Promise<Event | null> {
        await this.repository.update(id, { status });
        return await this.findById(id);
    }

    async incrementViewCount(id: string): Promise<Event | null> {
        await this.repository.increment({ id }, 'viewCount', 1);
        return await this.findById(id);
    }

    async incrementLikeCount(id: string): Promise<Event | null> {
        await this.repository.increment({ id }, 'likeCount', 1);
        return await this.findById(id);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async count(): Promise<number> {
        return await this.repository.count();
    }

    async countByStatus(status: 'upcoming' | 'active' | 'ended'): Promise<number> {
        return await this.repository.count({
            where: { status }
        });
    }

    async countByType(type: 'project_announcement' | 'partnership' | 'token_listing' | 'staking_event' | 'nft_drop' | 'airdrop'): Promise<number> {
        return await this.repository.count({
            where: { type }
        });
    }

    async countByScope(scope: 'all_projects' | 'hakuto_token' | 'ecosystem' | 'defi' | 'nft'): Promise<number> {
        return await this.repository.count({
            where: { scope }
        });
    }

    // 이벤트 상태 자동 업데이트를 위한 메서드
    async updateExpiredEvents(): Promise<void> {
        const now = new Date();
        
        // 시작 시간이 지난 upcoming 이벤트를 active로 변경
        await this.repository.update(
            {
                status: 'upcoming',
                startDate: Between(new Date(0), now)
            },
            { status: 'active' }
        );

        // 종료 시간이 지난 active 이벤트를 ended로 변경
        await this.repository.update(
            {
                status: 'active',
                endDate: Between(new Date(0), now)
            },
            { status: 'ended' }
        );
    }
}
