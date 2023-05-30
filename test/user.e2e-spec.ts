import { INestApplication } from "@nestjs/common";
import { TestingModule, Test } from "@nestjs/testing";
import { AppModule } from "./../src/app.module";
import { PrismaService } from "./../src/prisma.service";
import { User } from "@prisma/client";
import * as request from 'supertest';
import { AppController } from "./../src/app.controller";
import { TelegramService } from "./../src/telegram/telegram.service";
import { SafeUser } from "./../src/user/user.service";

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let telegram: TelegramService;
  let selfUser: SafeUser;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    telegram = app.get(TelegramService);
    const controller = app.get(AppController);
    await app.init();
    await telegram.stopBotInstance()
    
    selfUser = await controller.register({
      email: 'user11@gmail.com',
      password: 'password1',
    });

    const response2 = await controller.login({
      user: selfUser,
      email: selfUser.email,
      password: selfUser.password
    });
    token = response2.accessToken;
  });

  afterAll(async () => {
    const deleteUser = prisma.user.deleteMany()
    
    await prisma.$transaction([
      deleteUser
    ])
  
    await prisma.$disconnect()
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const res = await request(app.getHttpServer())
      .get('/user')
      .auth(token, {type: 'bearer'})
      .expect(200);

      expect(res.body).toMatchObject(selfUser)
    })

    it('should throw unauthorized error if the token is missing or invalid', async () => {
      await request(app.getHttpServer())
      .get('/user')
      .auth('invalid token', {type: 'bearer'})
      .expect(401)

      await request(app.getHttpServer())
      .get('/user')
      .expect(401)
    })
  })

  describe('Update Profile', () => {
    it('should return profile with updated username', async () => {
      const res = await request(app.getHttpServer())
      .post('/user')
      .auth(token, {type: 'bearer'})
      .send({
        name: 'Vlad'
      })
      .expect(201);

      expect(res.body.name).toBe('Vlad')
    })

    it('should update user password without displaying it', async () => {
      const new_password = 'newPassword123'
      let res = await request(app.getHttpServer())
      .post('/user')
      .auth(token, {type: 'bearer'})
      .send({
        password: new_password
      })
      .expect(201);
      
      expect(res.body.hasOwnProperty('password')).toBeFalsy()
      
      res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: selfUser.email,
        password: new_password
      })
      .expect(201);

      expect(res.body.hasOwnProperty('accessToken')).toBeTruthy()
      token = res.body.accessToken
    })

    it('should return a user with new profile image', async () => {
      const res = await request(app.getHttpServer())
      .post('/user')
      .auth(token, {type: 'bearer'})
      .attach('file', './test/samples/cat.jpg')
      .expect(201);

      expect(res.body.hasOwnProperty('image')).toBeTruthy()
      expect(typeof res.body.image).toBe('string')
    })
  })
})