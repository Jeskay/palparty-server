import { Test, TestingModule } from '@nestjs/testing';
import { CommentController } from './comment.controller';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { CommentService } from './comment.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Role } from '../auth/roles';
import { EventService } from '../event/event.service';
import { Status } from '@prisma/client';

describe('CommentController', () => {
  let controller: CommentController;
  let commentService: DeepMocked<CommentService>;
  let eventService: DeepMocked<EventService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        { provide: CommentService, useValue: createMock<CommentService>() },
        { provide: EventService, useValue: createMock<EventService>() },
      ]
    }).compile();

    controller = module.get<CommentController>(CommentController);
    commentService = module.get(CommentService);
    eventService = module.get(EventService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createComment', () => {
    const commentDto = {
      id: 1,
      content: 'Love the people, it was a really fun trip',
      eventId: 2,
      authorId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      reactions: 1
    };
    const eventDto = {
      id: 2,
      name: 'mountain trip',
      description: 'lets go to the peak of the local mountain',
      status: Status.WAITING,
      hostId: 1,
      createdAt: new Date(),
      repostedId: null,
      date: new Date(),
      groupLink: null,
      reposted: null,
      comments: [],
      participants: []
    };
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

    const req = {user: userDto};

    it('should return an instance of a new comment', async () => {
      commentService.create.mockResolvedValueOnce(commentDto)
      eventService.eventById.mockResolvedValueOnce(eventDto)

      await expect(controller.createComment(req, 2, {content: commentDto.content}))
      .resolves
      .toStrictEqual(commentDto);
    })

    it('should return a status code of 417', async () => {
      commentService.create.mockRejectedValueOnce(new Error("unexpected error"))
      eventService.eventById.mockResolvedValueOnce(eventDto)

      await expect(controller.createComment(req, 2, {content: commentDto.content}))
      .rejects
      .toThrow(new HttpException("Can't create comment", HttpStatus.EXPECTATION_FAILED))
    })

    it('should return a status code of 400', async () => {
      commentService.create.mockResolvedValueOnce(commentDto)
      eventService.eventById.mockResolvedValueOnce(eventDto)

      await expect(controller.createComment({}, 2, {content: commentDto.content}))
      .rejects
      .toThrow(new HttpException("Can't fetch user information", HttpStatus.BAD_REQUEST))
    })

    it('should return a status code of 400', async () => {
      commentService.create.mockResolvedValueOnce(commentDto)
      eventService.eventById.mockResolvedValueOnce(null)

      await expect(controller.createComment(req, 2, {content: commentDto.content}))
      .rejects
      .toThrow(new HttpException("Event with provided id does not exist", HttpStatus.BAD_REQUEST))
    })

    it('should return a status code of 400', async () => {
      commentService.create.mockResolvedValueOnce(commentDto)
      eventService.eventById.mockResolvedValueOnce(eventDto)

      await expect(controller.createComment({user: null}, 2, {content: commentDto.content}))
      .rejects
      .toThrow(new HttpException("Can't fetch user information", HttpStatus.BAD_REQUEST))
    })

  })

  describe('deleteComment', () => {
    const commentDto = {
      id: 1,
      content: 'Love the people, it was a really fun trip',
      eventId: 2,
      authorId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      reactions: 1
    };
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

    const req = {user: userDto};

    it('should return an ok message', async () => {
      commentService.delete.mockResolvedValueOnce(commentDto)
      commentService.commentById.mockResolvedValueOnce(commentDto)

      await expect(controller.deleteComment(req, 1))
      .resolves
      .toEqual("ok")
    })

    it('should return a status code of 417', async () => {
      commentService.delete.mockRejectedValueOnce(new Error("unexpected error"))
      commentService.commentById.mockResolvedValueOnce(commentDto)

      await expect(controller.deleteComment(req, 1))
      .rejects
      .toThrow(new HttpException("Can't delete comment", HttpStatus.EXPECTATION_FAILED))
    })


    it('should return a status code of 400', async () => {
      const commentDto = {
        id: 1,
        content: 'Love the people, it was a really fun trip',
        eventId: 2,
        authorId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        reactions: 1
      };

      commentService.delete.mockResolvedValueOnce(commentDto)
      commentService.commentById.mockResolvedValueOnce(commentDto)

      await expect(controller.deleteComment(req, 1))
      .rejects
      .toThrow(new HttpException("User is not an author of the comment", HttpStatus.BAD_REQUEST))
    })
  })
});
