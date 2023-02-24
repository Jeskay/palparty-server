import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CommentService {
    constructor(private readonly prisma: PrismaService) {}

    async create(userId: number, eventId: number, comment: Prisma.CommentCreateInput) {
        return this.prisma.comment.create({
            data: {
                authorId: userId,
                eventId: eventId,
                content: comment.content,
                reactions: comment.reactions
            }
        })
    }
}
