import { INestApplication } from "@nestjs/common"
import { PrismaService } from "./../src/prisma.service";
import { TestingModule, Test } from "@nestjs/testing";
import { AppModule } from "./../src/app.module";
import { TelegramService } from "./../src/telegram/telegram.service";
import { SafeUser } from "./../src/user/user.service";
import { AppController } from "./../src/app.controller";
import { EventCreateDto } from "./../src/Dto/event";
import { Event, Status } from "@prisma/client";
import * as request from 'supertest';
import { EmptyLogger } from "./utils/emptyLogger";

describe('CommentController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let telegram: TelegramService;
    let selfUser: SafeUser, adminUser: SafeUser;
    let selfToken: string, adminToken: string;
    let commentId: number;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule]
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useLogger(new EmptyLogger());
        prisma = app.get(PrismaService);
        telegram = app.get(TelegramService);
        const controller = app.get(AppController)
        await app.init();
        await telegram.stopBotInstance();

        selfUser = await controller.register({
            email: 'eventuser@gmail.com',
            password: 'easypass'
        });
        adminUser = await controller.register({
            email: 'eventadmin@gmail.com',
            password: 'hardpass'
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
        const deleteComment = prisma.comment.deleteMany()
        const deleteEvent = prisma.event.deleteMany()
        const deleteUserOnEvent = prisma.usersOnEvents.deleteMany()
        const deleteUser = prisma.user.deleteMany()

        await prisma.$transaction([
            deleteComment,
            deleteEvent,
            deleteUserOnEvent,
            deleteUser
        ])

        await prisma.$disconnect()
    });

    describe('createComment', () => {
        
        let eventSample: Event;
        
        beforeAll(async () => {
            const eventSampleDto: EventCreateDto = {
                name: 'Night Club',
                description: 'Looking for a company to go to the local night club. I feel embarrassed to go on my own.',
                status: Status.WAITING,
                date: new Date(Date.now() + 100000000)
            };
            const res = await request(app.getHttpServer())
            .post('/event')
            .auth(adminToken, {type: 'bearer'})
            .send(eventSampleDto)
            .expect(201);

            eventSample = res.body;
        })

        it('should not allow to comment non existing event', async () => {
            const comment = {
                content: 'Would you mind if I bring my friends as well?'
            };

            await request(app.getHttpServer())
            .post('/comment')
            .auth(selfToken, {type: 'bearer'})
            .query({eventId: '404'})
            .send(comment)
            .expect(400);
        })

        it('should not allow to comment when unauthorized', async () => {
            const comment = {
                content: 'Would you mind if I bring my friends as well?'
            };

            await request(app.getHttpServer())
            .post('/comment')
            .auth('invalid_token', {type: 'bearer'})
            .query({eventId: eventSample.id})
            .send(comment)
            .expect(401);

            await request(app.getHttpServer())
            .post('/comment')
            .query({eventId: eventSample.id})
            .expect(401);
        })

        it('should allow to comment event', async () => {
            const comment = {
                content: 'Would you mind if I bring my friends as well?'
            };
            
            const res = await request(app.getHttpServer())
            .post('/comment')
            .auth(selfToken, {type: 'bearer'})
            .query({eventId: eventSample.id})
            .send(comment)
            .expect(201);

            commentId = res.body.id;

        })
    })

    describe('deleteComment', () => {
        let eventSample: Event;

        beforeAll(async () => {
            const eventSampleDto: EventCreateDto = {
                name: 'Mountain bike',
                description: 'Looking for a company to go mountain biking.',
                status: Status.WAITING,
                date: new Date(Date.now() + 100000000)
            };
            const res = await request(app.getHttpServer())
            .post('/event')
            .auth(adminToken, {type: 'bearer'})
            .send(eventSampleDto)
            .expect(201);

            eventSample = res.body;
        })

        it('should not allow to delete comment when unauthorized', async () => {

            await request(app.getHttpServer())
            .delete('/comment')
            .auth('invalid_token', {type: 'bearer'})
            .query({id: commentId})
            .expect(401);

            await request(app.getHttpServer())
            .delete('/comment')
            .query({id: commentId})
            .expect(401);
        })

        it('should not allow to delete other user comment', async () => {
            await request(app.getHttpServer())
            .delete('/comment')
            .auth(adminToken, {type: "bearer"})
            .query({id: commentId})
            .expect(400);
        })

        it('should allow to delete existing comment', async () => {
            await request(app.getHttpServer())
            .delete('/comment')
            .auth(selfToken, {type: 'bearer'})
            .query({id: commentId})
            .expect(200);
        })
       
    })
})