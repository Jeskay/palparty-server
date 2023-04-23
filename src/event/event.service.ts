import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Event, Prisma, Status } from '@prisma/client';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter'
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Injectable()
export class EventService {

    private readonly logger = new Logger(EventService.name)

    constructor(
        private prisma: PrismaService, 
        private evenEmitter: EventEmitter2,
        private scheduleRegistry: SchedulerRegistry,
    ) {}

    async eventById(id: number) {
        return await this.prisma.event.findUnique({
            where: {
                id
            }, 
            include: {
                comments: true,
                participants: true,
            }
        });
    }

    async events(page: number, pageSize: number = 10, status: Status[] = [Status.WAITING], excluding: boolean = false) {
        const filter = excluding ? {notIn: status} : {in: status};
        return await this.prisma.event.findMany({
            where: {
                status: filter
            },
            include: {
                participants: true,
                reposted: true,
                comments: true,
            },
            take: pageSize,
            skip: page * pageSize,
        });
    }

    async eventsOfficial(status: Status = Status.WAITING) {
        return await this.prisma.event.findMany({
            where: {
                status,
                NOT: {
                    repostedId: null
                }
            },
            include: {
                participants: true,
                reposted: true,
                comments: true
            }
        })
    }

    async eventsFetch(page: number, display: number = 5) {
        return await this.prisma.event.findMany({
            take: display,
            skip: page * display,
            orderBy: [
                {
                    createdAt: 'desc'
                }
            ]
        })
    }

    async updateInfo(event: Prisma.EventWhereUniqueInput, data: Prisma.EventUpdateInput) {
        return await this.prisma.event.update({
            where: {
                id: event.id
            },
            data
        })
    }

    async create(eventData: Prisma.EventCreateInput): Promise<Event> {
        if(new Date(eventData.date).getTime() + 10000 < new Date(Date.now()).getTime())
            throw new BadRequestException("Event date in past, event will never start");
        const event = await this.prisma.event.create({data: eventData});
        const job = new CronJob(event.date, () => {
            this.evenEmitter.emit('event.set.status', event.id, Status.ACTIVE)
        });
        const dayToMilliseconds = 86400000;
        const nextDay = new Date(event.date.getTime() + dayToMilliseconds);
        const job2 = new CronJob(nextDay, async () => {
            this.evenEmitter.emit('event.set.status', event.id, Status.PASSED)
        });
        this.scheduleRegistry.addCronJob(`Event ${event.id} started`, job)
        this.scheduleRegistry.addCronJob(`Event ${event.id} finished`, job2)
        job.start();
        job2.start();
        return event
    }

    async join(eventId: number, userId: number) {
        const event = await this.eventById(eventId);
        if(event.hostId == userId)
            throw new BadRequestException("You are already hosting the event")
        if(event.status != Status.WAITING)
            throw new BadRequestException("Event is no longer accepting new attendants")
        return await this.prisma.usersOnEvents.create({
            data: {
                userId: userId, 
                eventId: eventId
            }
        });
    }

    async leave(eventId: number, userId: number) {
        return await this.prisma.usersOnEvents.delete({
            where: {
                userId_eventId: {userId, eventId}
            }
        })
    }

    @OnEvent('event.set.status')
    async updateEventStatus(eventId: number, status: Status) {
        const event = await this.prisma.event.update({
            where: {
                id: eventId
            }, 
            data: {
                status
            }
        });
        this.logger.log(`"${event.name}" event status set to ${status}`)
    }
    
}
