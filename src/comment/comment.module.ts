import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { EventModule } from '../event/event.module';

@Module({
  imports: [EventModule],
  providers: [CommentService, PrismaService],
  exports: [CommentService],
  controllers: [CommentController]
})
export class CommentModule {}
