import { BadRequestException, Body, Controller, Get, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import RoleGuard from '../auth/role.guard';
import { Role } from '../auth/roles';

@Controller('user')
@UseGuards(RoleGuard(Role.PERSON))
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(private readonly userService: UserService) {}
    
    @Get()
    async getProfile(@Req() req) {
      const profile = await this.userService.user({email: req.user.email});
      return profile;
    }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async updateProfile(@Req() req, @UploadedFile() file: Express.Multer.File, @Body() body: {name: string, password: string}) {
      if (req.user == null)
        throw new BadRequestException("Cant't fetch user information")
      const updated = await this.userService.updateUserInfo(req.user, file ? file.buffer : undefined, body);
      return updated;
    }

    @Post('image')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(@Req() req, @UploadedFile() file: Express.Multer.File) {
      if (req.user == null)
        throw new BadRequestException("Can't fetch user information")
      const updated = await this.userService.updateUserInfo(req.user, file.buffer)
      return updated
    }
}
