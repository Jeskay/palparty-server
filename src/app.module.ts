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
import { TelegrafModule } from 'nestjs-telegraf';
import { BotName, sessionMiddleware } from './telegram/constants';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    AuthModule, 
    UserModule, 
    AuthModule, 
    EventModule, 
    CloudinaryModule, 
    CommentModule,
    TelegramModule,
    EventEmitterModule.forRoot({
      wildcard: false,
      maxListeners: 10
    }),
    ScheduleModule.forRoot(),
    TelegrafModule.forRootAsync({
      botName: BotName,
      useFactory: () => ({
        token: process.env.TELEGRAM_BOT_TOKEN,
        middlewares: [sessionMiddleware],
        include: [TelegramModule, AuthModule, UserModule, EventModule]
      })
    })
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
