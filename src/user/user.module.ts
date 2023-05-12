import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PrismaService } from '../prisma.service';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [CloudinaryModule],
  providers: [UserService, PrismaService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
