import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  providers: [EventService, PrismaService],
  exports: [EventService],
  controllers: [EventController]
})
export class EventModule {}
