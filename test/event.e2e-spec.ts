import { INestApplication } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing";
import * as request from 'supertest';
import { AppModule } from "./../src/app.module";
import { PrismaService } from "./../src/prisma.service";
import { TelegramService } from "./../src/telegram/telegram.service";
import { AppController } from "./../src/app.controller";
import { SafeUser } from "./../src/user/user.service";
import { EventCreateDto } from "./../src/Dto/event";
import { Status } from "@prisma/client";
import { EmptyLogger } from "./utils/emptyLogger";

describe('EventController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let telegram: TelegramService;
    let selfUser: SafeUser, adminUser: SafeUser;
    let selfToken: string, adminToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule]
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useLogger(new EmptyLogger());
        prisma = app.get(PrismaService);
        telegram = app.get(TelegramService);
        const controller = app.get(AppController);
        await app.init();
        await telegram.stopBotInstance()

        selfUser = await controller.register({
            email: 'eventparticipant@gmail.com',
            age: 34,
            password: 'averagepass'
        });
        adminUser = await controller.register({
            email: 'eventhost@gmail.com',
            age: 34,
            password: 'secretpass'
        });

        selfToken = (await controller.login({
            user: selfUser,
            email: selfUser.email,
            password: selfUser.password
        })).accessToken;

        adminToken = (await controller.login({
            user: adminUser,
            email: adminUser.email,
            password: adminUser.password
        })).accessToken;
    });

    afterAll(async () => {
        const deleteEvent = prisma.event.deleteMany()
        const deleteUserOnEvent = prisma.usersOnEvents.deleteMany()
        const deleteUser = prisma.event.deleteMany()

        await prisma.$transaction([
            deleteUserOnEvent,
            deleteEvent,
            deleteUser
        ])

        await prisma.$disconnect()
    });

    describe('createEvent', () => { 
        const eventSample = {
            name: 'Birthday party',
            description: 'Tomorrow I will turn 20. Come everyone even if you do not have any gift.',
            status: Status.WAITING.toString(),
            date: (new Date(Date.now() + 100000000)).toISOString()
        };

        it('should not be able to create event while unauthorized', async () => {
            await request(app.getHttpServer())
            .post('/event')
            .send(eventSample)
            .expect(401);
        });

        it('should not be able to create event while unauthorized', async () => {
            await request(app.getHttpServer())
            .post('/event')
            .auth('invalid_token', {type: 'bearer'})
            .send(eventSample)
            .expect(401);
        });

        it('should create a new event instance', async () => {
            const res = await request(app.getHttpServer())
            .post('/event')
            .auth(adminToken, {type: 'bearer'})
            .send(eventSample)
            .expect(201);
            expect(res.body).toMatchObject(eventSample);
        });

        it('should return event with two images', async () => {
            const res = await request(app.getHttpServer())
            .post('/event')
            .auth(adminToken, {type: 'bearer'})
            .attach('file', './test/samples/cat.jpg')
            .attach('file', './test/samples/man.jpg')
            .field(eventSample)
            .expect(201);

            expect(res.body.hasOwnProperty('images')).toBeTruthy()
            expect(typeof res.body.images).toBe('string')
        })
    })

    describe('EventById', () => {
        const eventSample: EventCreateDto = {
            name: 'Anniversary',
            description: 'Me and my spouse will have our first anniversary this week.',
            status: Status.WAITING,
            date: new Date(Date.now() + 100000000)
        };
        let idSample: number;

        beforeAll( async () => {
            const res = await request(app.getHttpServer())
                .post('/event')
                .auth(adminToken, {type: 'bearer'})
                .send(eventSample)
                .expect(201);
            idSample = res.body.id;
        })
        

        it('should not be able to access while unauthorized', async () => {
            await request(app.getHttpServer())
            .get('/event')
            .query({id: idSample.toString()})
            .expect(401);
        });

        it('should return status 400 for non existing event', async () => {
            await request(app.getHttpServer())
            .get('/event')
            .auth(adminToken, {type: 'bearer'})
            .query({id: '404'})
            .expect(404);
        });

        it('should return the instance of the correct event', async () => {
            const res = await request(app.getHttpServer())
            .get('/event')
            .auth(adminToken, {type: 'bearer'})
            .query({id: idSample.toString()})
            .expect(200);
            if(typeof eventSample.date != 'string')
                eventSample.date = eventSample.date.toISOString();
            expect(res.body).toMatchObject(eventSample);
        })
    })

    describe('joinEvent', () => {
        const eventSample: EventCreateDto = {
            name: 'Film Terminator Genesis',
            description: 'I want to find someone to go to the cinema tomorrow.',
            status: Status.WAITING,
            date: new Date(Date.now() + 100000000)
        };
        let idSample: number;

        beforeAll(async () => {
            const res = await request(app.getHttpServer())
            .post('/event')
            .auth(adminToken, {type: 'bearer'})
            .send(eventSample)
            .expect(201);
         idSample = res.body.id;
        });
        
        it('should not be able to access while unauthorized', async () => {
            await request(app.getHttpServer())
            .post('/event/join')
            .auth('invalid_token', {type: 'bearer'})
            .query({id: idSample})
            .expect(401);

            await request(app.getHttpServer())
            .post('/event/join')
            .query({id: idSample})
            .expect(401);
        })

        it('should be able to join event', async () => {
            await request(app.getHttpServer())
            .post('/event/join')
            .auth(selfToken, {type: 'bearer'})
            .query({id: idSample})
            .expect(201);
        })

        it('should not be able to join the same event twice', async () => {
            await request(app.getHttpServer())
            .post('/event/join')
            .auth(selfToken, {type: 'bearer'})
            .query({id: idSample})
            .expect(400);
        })
    })
})