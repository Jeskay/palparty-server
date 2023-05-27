import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma.service';
import { TelegramService } from './../src/telegram/telegram.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let telegram: TelegramService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    telegram = app.get(TelegramService);
    await app.init();
  });

  afterAll(async () => {
    const deleteUser = prisma.user.deleteMany()
    
    await prisma.$transaction([
      deleteUser
    ])
  
    await prisma.$disconnect()
    await telegram.stopBotInstance()
  });

  const user1Dto = {
    email: 'user1@gmail.com',
    password: 'password123',
    name: 'user1'
  }
  const user2Dto = {
    email: 'user2',
    password: 'pass321'
  }
  const personDto = {
    email: 'person@gmail.com',
    password: '1956'
  }

  describe('register', () => {

    it('should create a new user', async () => {
      await request(app.getHttpServer())
      .post('/auth/register')
      .send(user1Dto)
      .expect(201)

      await request(app.getHttpServer())
      .post('/auth/register')
      .send(user2Dto)
      .expect(201)
    });

    it('should not accept already registered users', async () => {
      await request(app.getHttpServer())
      .post('/auth/register')
      .send(user2Dto)
      .expect(400)
    })

    it('should accept uploading profile images', async () => {
      await request(app.getHttpServer())
      .post('/auth/register')
      .attach('file', 'test/samples/man.jpg')
      .field(personDto)
      .expect(201)
    })
  })

  describe('login', () => {
    it('should be able to log in registered account', async () => {
      await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: user1Dto.email,
        password: user1Dto.password
      })
      .expect(201)

      await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: user2Dto.email,
        password: user2Dto.password
      })
      .expect(201)
    })

    it('should not be able to log in non registered account', async () => {
      await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'hacker@gmail.com',
        password: '123321'
      })
      .expect(401)
    })

    it('should not be able to log in with incorrect password', async () => {
      await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: user1Dto.email,
        password: 'incorrect password'
      })
      .expect(401)

      await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: user1Dto.email
      })
      .expect(401)
    })
  })
});
