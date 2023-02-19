import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
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
  async login(@Req() req) {
    return this.authService.login(req.user);
  }

  @Post('auth/register')
  async register(@Query() params: any) {
    console.log(params);
    const existing = await this.userService.user({email: params.email});
    if (existing) 
      throw new HttpException('User with email address already exists', HttpStatus.BAD_REQUEST);
    return await this.userService.createUser({
      name: params.name,
      password: params.password,
      email: params.email,
      role: 'PERSON'
    });
  }

  @Get('profile')
  @UseGuards(RoleGuard(Role.Person))
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    return req.user;
  }
}
