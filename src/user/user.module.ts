import { Module } from '@nestjs/common';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { PrismaService } from 'src/prisma.service';
import { UserService } from './user.service';

@Module({
  imports: [CloudinaryModule],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}
