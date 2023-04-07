import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';

@Module({
  providers: [CommentService, PrismaService],
  exports: [CommentService],
  controllers: [CommentController]
})
export class CommentModule {}
