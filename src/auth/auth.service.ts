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

  async validateUser(email: string, pass: string): Promise<null | Omit< User, 'password' >> {
    const user = await this.userService.user({ email: email });
    if (user && user.password === pass) {
      delete user.password
      return user;
    }
    return null;
  }

  async fetchUser(email: string): Promise<User | null> {
    return await this.userService.user({ email: email });
  }

  async login(user: any) {
    const payload = {email: user.email, role: user.role};
    return { accessToken: this.jwtService.sign(payload) };
  }
}
