import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, Status } from '@prisma/client';

@Injectable()
export class EventService {
    constructor(private prisma: PrismaService) {}

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

    async events() {
        return await this.prisma.event.findMany({
            where: {
                status: Status.WAITING
            },
            include: {
                participants: true,
                reposted: true,
                comments: true,
            }
        });
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

    async create(event: Prisma.EventCreateInput) {
        return await this.prisma.event.create({data: event});
    }

    async join(eventId: number, userId: number) {
        const event = await this.eventById(eventId);
        if(event.hostId == userId)
            throw new BadRequestException("You are already hosting the event")
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
    
}
