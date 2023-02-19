import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService, 
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<null | any> {
    const user = await this.userService.user({ email: email });
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {email: user.email, role: user.role};
    return { accessToken: this.jwtService.sign(payload) };
  }
}
