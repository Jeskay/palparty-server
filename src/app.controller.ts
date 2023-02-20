import { Body, Controller, Get, HttpException, HttpStatus, Logger, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import RoleGuard from './auth/role.guard';
import { Role, Roles } from './auth/roles';
import { UserService } from './user/user.service';

@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('auth/login')
  @UseGuards(LocalAuthGuard)
  async login(@Req() req) {
    return await this.authService.login(req.user);
  }

  @Post('auth/register')
  async register(@Query() params: any) {
    console.log(params);
    const existing = await this.userService.user({email: params.email});
    if (existing) 
      throw new HttpException('User with email address already exists', HttpStatus.BAD_REQUEST);
    const result = await this.userService.createUser({
      name: params.name,
      password: params.password,
      email: params.email,
      role: Role.PERSON
    });
    return result;
  }

  @Get('profile')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    const profile = await this.userService.user({email: req.user.email});
    return profile;
  }
}
