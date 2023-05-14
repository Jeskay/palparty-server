import { BadRequestException, Body, Controller, Delete, Get, HttpException, HttpStatus, Logger, Param, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { Role } from './auth/roles';
import { CommentService } from './comment/comment.service';
import { UserService } from './user/user.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('auth/login')
  @UseGuards(LocalAuthGuard)
  async login(@Req() req) {
    if(!req.user)
     throw new BadRequestException("Can't fetch user information")
    const token = await this.authService.login(req.user).catch(err => {
     throw new BadRequestException("Can't fetch user information")
    });
    return token
  }

  @Post('auth/register')
  @UseInterceptors(FileInterceptor('file'))
  async register(@Body() body: {email: string, password: string, name?: string}, @UploadedFile() file?: Express.Multer.File) {
    const existing = await this.userService.user({email: body.email});
    if (existing) 
      throw new HttpException('User with email address already exists', HttpStatus.BAD_REQUEST);
    const result = await this.userService.createUser({
      name: body.name,
      password: body.password,
      email: body.email,
      role: Role.PERSON
    }, file ? file.buffer : undefined);
    return result;
  }
}
