import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService, 
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.userService.user({ email: email }, true);
    if (!user)
      return null;
    const isMatch = await bcrypt.compare(pass, user.password);
    if (isMatch) {
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
