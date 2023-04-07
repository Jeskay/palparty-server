import { BadRequestException, Body, Controller, Delete, Get, HttpException, HttpStatus, Logger, Param, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import RoleGuard from './auth/role.guard';
import { Role } from './auth/roles';
import { CommentService } from './comment/comment.service';
import { UserService } from './user/user.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly commentService: CommentService,
  ) {}

  @Post('auth/login')
  @UseGuards(LocalAuthGuard)
  async login(@Req() req) {
    return await this.authService.login(req.user);
  }

  @Post('auth/register')
  @UseInterceptors(FileInterceptor('file'))
  async register(@Body() body: {email: string, password: string, name: string}, @UploadedFile() file: Express.Multer.File) {
    const existing = await this.userService.user({email: body.email});
    if (existing) 
      throw new HttpException('User with email address already exists', HttpStatus.BAD_REQUEST);
    const result = await this.userService.createUser({
      name: body.name,
      password: body.password,
      email: body.email,
      role: Role.PERSON
    }, file.buffer);
    return result;
  }

  @Get('profile')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    const profile = await this.userService.user({email: req.user.email});
    return profile;
  }

  @Post('profile')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async updateProfile(@Req() req, @UploadedFile() file: Express.Multer.File, @Body() body: {name: string, password: string}) {
    if (req.user == null)
      throw new BadRequestException("Cant't fetch user information")
    const updated = await this.userService.updateUserInfo(req.user, file ? file.buffer : undefined, body);
    return updated;
  }

  @Post('user/image')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@Req() req, @UploadedFile() file: Express.Multer.File) {
    if (req.user == null)
      throw new BadRequestException("Can't fetch user information")
    const updated = await this.userService.updateUserInfo(req.user, file.buffer)
    return updated
  }

  
  
}
