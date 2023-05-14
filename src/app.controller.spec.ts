import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { UserService } from './user/user.service';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { AuthService } from './auth/auth.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Role } from './auth/roles';

describe('AppController', () => {
  let appController: AppController;
  let userService: DeepMocked<UserService>;
  let authService: DeepMocked<AuthService>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: UserService, useValue: createMock<UserService>() },
        { provide: AuthService, useValue: createMock<AuthService>() },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    userService = app.get(UserService);
    authService = app.get(AuthService);
  });
  
  it('should be defined', () => {
    expect(appController).toBeDefined()
  });

  describe('register', () => {
    it('should return a status of 400', async () => {
      userService.user.mockResolvedValueOnce({
        id: 1,
        telegramId: 12345,
        email: 'foo@bar.com',
        password: 'password',
        name: 'Ben',
        role: Role.PERSON,
        image: 'http://localhost:123/profile/image',
        eventsParticipant: [],
        eventsHosting: [],
      });
      await expect(appController.register({email: 'foo@bar.com', password: 'password'}))
      .rejects
      .toThrow(new HttpException('User with email address already exists', HttpStatus.BAD_REQUEST));
    })

    it('should return User instance', async () => {
      userService.user.mockResolvedValueOnce(null);
      userService.createUser.mockResolvedValueOnce({
        id: 2,
        telegramId: 3,
        email: 'tom@gmail.com',
        password: '54321',
        name: 'Tom',
        role: Role.PERSON,
        image: 'http://localhost:123/profile/image',
      });
      await expect(appController.register({email: 'tom@gmail.com', password: '54321'}))
      .resolves
      .toStrictEqual({
        id: 2,
        telegramId: 3,
        email: 'tom@gmail.com',
        password: '54321',
        name: 'Tom',
        role: Role.PERSON,
        image: 'http://localhost:123/profile/image',
      })
    })
  });

  describe('login', () => {
    const userDto = {
      email: 'tom@gmail.com',
      password: '54321',
      role: Role.PERSON,
    }
    const token = {accessToken:'accessToken'}
    const req = {user: userDto}

    it('should return user accessToken', async () => {
      authService.login.mockResolvedValueOnce(token);
      await expect(appController.login(req))
      .resolves
      .toStrictEqual(token)
    })

    it('should return a status code of 400', async () => {
      authService.login.mockRejectedValueOnce(new Error('invalid password'))
      await expect(appController.login(req))
      .rejects
      .toThrow(new HttpException("Can't fetch user information", HttpStatus.BAD_REQUEST))
    })
    
  });
});
