import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaService } from './prisma.service';
import { ConfigModule } from '@nestjs/config';
import { EventModule } from './event/event.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CommentModule } from './comment/comment.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    AuthModule, 
    UserModule, 
    AuthModule, 
    EventModule, 
    CloudinaryModule, 
    CommentModule,
    EventEmitterModule.forRoot({
      wildcard: false,
      maxListeners: 10
    }),
    ScheduleModule.forRoot(),
    TelegramModule.forRoot({token: process.env.TELEGRAM_BOT_TOKEN}),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
