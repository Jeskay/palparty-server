import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Role } from '../auth/roles';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  let userService: DeepMocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {provide: UserService, useValue: createMock<UserService>()},
      ]
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('get profile', () => {
    const userDto = {
      id: 1,
      telegramId: 12345,
      email: 'foo@bar.com',
      password: 'password',
      name: 'Ben',
      role: Role.PERSON,
      image: 'http://localhost:123/profile/image',
      eventsParticipant: [],
      eventsHosting: [],
    };

    it('get profile', async () => {
      userService.user.mockResolvedValueOnce(userDto);

      await expect(controller.getProfile({user: { email: 'foo@bar.com' } }))
      .resolves
      .toStrictEqual(userDto)
    })

    it('should return a status of 404', async () => {
      userService.user.mockRejectedValueOnce(new Error('not found'));

      await expect(controller.getProfile({ user: userDto }))
      .rejects
      .toThrow(new HttpException('not found', HttpStatus.NOT_FOUND));
    })

    it('should return a status code of 400', async () => {
      userService.updateUserInfo.mockResolvedValueOnce(userDto)
      await expect(controller.getProfile({}))
      .rejects
      .toThrow(new BadRequestException("Can't fetch user information"))
    })

    it('should return a status code of 400', async () => { 
      userService.updateUserInfo.mockResolvedValueOnce(userDto)
      await expect(controller.getProfile({user: null}))
      .rejects
      .toThrow(new BadRequestException("Can't fetch user information"))
    })
  })

  describe('update profile', () => {
    const userDto = {
      id: 2,
      telegramId: 12345,
      email: 'foo@bar.com',
      password: 'password123',
      name: 'OldName',
      role: Role.PERSON,
      image: 'http://localhost:123/profile/image',
      eventsParticipant: [],
      eventsHosting: [],
    }
    const req = {user: userDto}
    const file = null
    const body = { name: 'newName', password: 'password123'}

    it('return updated instance', async () => {
      userService.updateUserInfo.mockResolvedValueOnce(userDto)
      await expect(controller.updateProfile(req, file, body))
      .resolves
      .toStrictEqual(userDto)
    })

    it('should return a status code of 417', async () => {
      userService.updateUserInfo.mockRejectedValueOnce(new Error('something went wrong in database'))  
      await expect(controller.updateProfile(req, file, body))
      .rejects
      .toThrow(new HttpException('something went wrong', HttpStatus.EXPECTATION_FAILED))
    })

    it('should return a status code of 400', async () => {
      userService.updateUserInfo.mockResolvedValueOnce(userDto)
      await expect(controller.updateProfile({}, file, body))
      .rejects
      .toThrow(new BadRequestException("Can't fetch user information"))
    })

    it('should return a status code of 400', async () => { 
      userService.updateUserInfo.mockResolvedValueOnce(userDto)
      await expect(controller.updateProfile({user: null}, file, body))
      .rejects
      .toThrow(new BadRequestException("Can't fetch user information"))
    })
  })

  describe('update image', () => {
    const userDto = {
      id: 2,
      telegramId: 12345,
      email: 'foo@bar.com',
      password: 'password123',
      name: 'OldName',
      role: Role.PERSON,
      image: 'http://localhost:123/profile/image',
      eventsParticipant: [],
      eventsHosting: [],
    }
    const file = {
      buffer: null,
      fieldname: null, 
      originalname: null, 
      encoding: null, 
      mimetype: null,
      size: null, 
      stream: null, 
      destination: null, 
      filename: null, 
      path: null, 
    }
    const req = {user: userDto}

    it('return updated instance', async () => {
      userService.updateUserInfo.mockResolvedValueOnce(userDto)
      await expect(controller.uploadImage(req, file))
      .resolves
      .toStrictEqual(userDto)
    })

    it('should return a status code of 417', async () => {
      userService.updateUserInfo.mockRejectedValueOnce(new Error('something went wrong with the database'))
      await expect(controller.uploadImage(req, file))
      .rejects
      .toThrow(new HttpException('something went wrong', HttpStatus.EXPECTATION_FAILED))
    })

    it('should return a status code of 400', async () => {
      userService.updateUserInfo.mockResolvedValueOnce(userDto)
      await expect(controller.uploadImage({}, file))
      .rejects
      .toThrow(new BadRequestException("Can't fetch user information"))
    })

    it('should return a status code of 400', async () => { 
      userService.updateUserInfo.mockResolvedValueOnce(userDto)
      await expect(controller.uploadImage({user: null}, file))
      .rejects
      .toThrow(new BadRequestException("Can't fetch user information"))
    })
  })
});
