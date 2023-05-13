import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { Role } from '../auth/roles';

@Injectable()
export class CommentService {
    constructor(private readonly prisma: PrismaService) {}

    async create(userId: number, eventId: number, content: string) {
        return this.prisma.comment.create({
            data: {
                authorId: userId,
                eventId: eventId,
                content: content,
            }
        });
    }

    async commentById(id: number) {
        return this.prisma.comment.findUnique({ 
            where: { 
                id 
            }
        });
    }

    async delete(user: User, commentId: number) {
        const comment = await this.prisma.comment.findUnique({
            where: {
                id: commentId
            }
        });

        if(comment.authorId != user.id && user.role != Role.ADMIN)
            throw new BadRequestException('You have no permission to delete other person comments.')
        
        return await this.prisma.comment.delete({
            where: {
                id: commentId
            }
        });
    }
}
