import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventService } from './event.service';

@Module({
  providers: [EventService, PrismaService],
  exports: [EventService]
})
export class EventModule {}
