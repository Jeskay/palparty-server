import { BadRequestException, Body, Controller, Get, HttpException, HttpStatus, Logger, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import RoleGuard from '../auth/role.guard';
import { Role } from '../auth/roles';
import { UserUpdateDto } from '../Dto/user';

@Controller('user')
@UseGuards(RoleGuard(Role.PERSON))
@UseGuards(JwtAuthGuard)
export class UserController {
    private logger: Logger = new Logger(UserController.name);

    constructor(private readonly userService: UserService) {}
    
    @Get()
    async getProfile(@Req() req) {
      if (!req.user)
        throw new BadRequestException("Can't fetch user information")
      const profile = await this.userService.user({email: req.user.email});
      return profile;
    }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async updateProfile(@Req() req, @UploadedFile() file: Express.Multer.File, @Body() body: UserUpdateDto) {
      if (!req.user)
        throw new BadRequestException("Can't fetch user information")
      const updated = await this.userService.updateUserInfo(req.user, file ? file.buffer : undefined, body)
      .catch(err => {
        this.logger.error(err)
        throw new HttpException("something went wrong", HttpStatus.EXPECTATION_FAILED)
      })
      return updated;
    }

    @Post('image')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(@Req() req, @UploadedFile() file: Express.Multer.File) {
      if (!req.user)
        throw new BadRequestException("Can't fetch user information")
      const updated = await this.userService.updateUserInfo(req.user, file.buffer)
      .catch(err => {
        this.logger.error(err)
        throw new HttpException("something went wrong", HttpStatus.EXPECTATION_FAILED)
      })
      return updated
    }
}
