import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService, 
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.userService.user({ email: email }, true);
    
    if (user && user.password === pass) {
      const {password, ...otherProps} = user;
      return otherProps;
    }
    return null;
  }

  async fetchUser(email: string) {
    return await this.userService.user({ email: email }, true);
  }

  async login(user: any) {
    const payload = {email: user.email, role: user.role};
    return { accessToken: this.jwtService.sign(payload) };
  }
}
