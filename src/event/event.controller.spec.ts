import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { EventService } from './event.service';
import { Event, Status } from '@prisma/client';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Role } from '../auth/roles';
import { EmptyLogger } from '../../test/utils/emptyLogger';

describe('EventController', () => {
  let controller: EventController;
  let eventService: DeepMocked<EventService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        { provide: EventService, useValue: createMock<EventService>()},
      ]
    }).compile();
    module.useLogger(new EmptyLogger());

    controller = module.get<EventController>(EventController);
    eventService = module.get(EventService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('eventById', () => {
    const eventDto = {
      id: 1,
      name: ' birthday party',
      description: 'my 1st anniversary',
      shortDescription: null,
      images: null,
      status: Status.WAITING,
      hostId: 1,
      createdAt: new Date(),
      repostedId: null,
      date: new Date(),
      groupLink: null,
      comments: [],
      participants: []
    }
    
    it('should return event instance', async () => {
      eventService.eventById.mockResolvedValueOnce(eventDto)

      await expect(controller.eventById(1))
      .resolves
      .toStrictEqual(eventDto)
    })

    it('should return a status code of 400', async () => {
      eventService.eventById.mockRejectedValueOnce(new Error('event not found'))
      await expect(controller.eventById(1))
      .rejects
      .toThrow(new HttpException("Event with provided id was not found", HttpStatus.BAD_REQUEST))
    })
  })

  describe('getEvents', () => {
    const eventList = [
      {
        id: 1,
        name: ' birthday party',
        description: 'my 1st anniversary',
        shortDescription: null,
        images: null,
        status: Status.WAITING,
        hostId: 1,
        host: {
          id: 1,
          telegramId: 12345,
          age: 19,
          email: 'foo@bar.com',
          password: 'password',
          name: 'Ben',
          role: Role.PERSON,
          image: 'http://localhost:123/profile/image',
          eventsParticipant: [],
          eventsHosting: [],
        },
        createdAt: new Date(),
        repostedId: null,
        date: new Date(),
        groupLink: null,
        comments: [],
        participants: [],
        reposted: null
      },
      {
        id: 2,
        name: 'mountain trip',
        description: 'lets go to the peak of the local mountain',
        shortDescription: null,
        images: null,
        status: Status.WAITING,
        hostId: 2,
        host: {
          id: 2,
          telegramId: 12345,
          age: 19,
          email: 'foo@bar.com',
          password: 'password123',
          name: 'OldName',
          role: Role.PERSON,
          image: 'http://localhost:123/profile/image',
          eventsParticipant: [],
          eventsHosting: [],
        },
        createdAt: new Date(),
        repostedId: null,
        date: new Date(),
        groupLink: null,
        comments: [],
        participants: [],
        reposted: null
      }
    ];

    it('should return a list of events', async () => {
      eventService.events.mockResolvedValueOnce(eventList)
      await expect(controller.getEvents(1, 2))
      .resolves
      .toStrictEqual(eventList)
    })

    it('should return a status code of 400', async () => {
      eventService.events.mockRejectedValueOnce(new Error('unexpected error'))
      await expect(controller.getEvents(1, 2))
      .rejects
      .toThrow(new HttpException("invalid query params", HttpStatus.BAD_REQUEST))
    })
  })

  describe('createEvent', () => {
    const eventDto = {
      id: 2,
      name: 'mountain trip',
      description: 'lets go to the peak of the local mountain',
      shortDescription: null,
      images: null,
      status: Status.WAITING,
      hostId: 2,
      createdAt: new Date(),
      repostedId: null,
      date: new Date(),
      groupLink: null,
      reposted: null
    }

    it('should return an updated event instance', async () => {
      eventService.create.mockResolvedValueOnce(eventDto)

      await expect(controller.createEvent(eventDto, [], {user: {id: 1}}))
      .resolves
      .toStrictEqual(eventDto)
    })

    it('should return a status code of 417', async () => {
      eventService.create.mockRejectedValueOnce(new Error("unexpected error"))

      await expect(controller.createEvent(eventDto, [], {user: {id: 2}}))
      .rejects
      .toThrow(new HttpException("Can't create new event", HttpStatus.EXPECTATION_FAILED))
    })
  })

  describe('joinEvent', () => {
    const userDto = {
      id: 1,
      telegramId: 12345,
      email: 'foo@bar.com',
      password: 'password',
      name: 'Ben',
      role: Role.PERSON,
      image: 'http://localhost:123/profile/image',
      eventsParticipant: [{
        id: 2,
        name: 'mountain trip',
        age: 19,
        description: 'lets go to the peak of the local mountain',
        status: Status.WAITING,
        hostId: 2,
        createdAt: new Date(),
        repostedId: null,
        date: new Date(),
        groupLink: null,
        reposted: null
      }],
      eventsHosting: [],
    }
    const req = {user: userDto}
    it('should return an ok message', async () => {
      eventService.join.mockResolvedValueOnce({eventId: 1, userId: 1})

      await expect(controller.joinEvent(req, 1))
      .resolves
      .toEqual('ok')
    })

    it('should return a status code of 400', async () => {
      eventService.join.mockRejectedValueOnce(new Error("unexpected error"))

      await expect(controller.joinEvent(req, 1))
      .rejects
      .toThrow(new HttpException("Could not join event", HttpStatus.EXPECTATION_FAILED))
    })

    it('should return a status code of 400', async () => {
      eventService.join.mockResolvedValueOnce({eventId: 1, userId: 1})

      await expect(controller.joinEvent({}, 1))
      .rejects
      .toThrow(new HttpException("Can't fetch user information", HttpStatus.BAD_REQUEST))
    })
    
    it('should return a status code of 400', async () => {
      eventService.join.mockResolvedValueOnce({eventId: 1, userId: 1})

      await expect(controller.joinEvent({user: null}, 1))
      .rejects
      .toThrow(new HttpException("Can't fetch user information", HttpStatus.BAD_REQUEST))
    })

    it('should return a status code of 400', async () => {
      eventService.join.mockResolvedValueOnce({eventId: 1, userId: 1})

      await expect(controller.joinEvent(req, 2))
      .rejects
      .toThrow(new HttpException("User already joined event", HttpStatus.BAD_REQUEST))
    })
  })

  describe('leaveEvent', () => {
    const userDto = {
      id: 1,
      age: 19,
      telegramId: 12345,
      email: 'foo@bar.com',
      password: 'password',
      name: 'Ben',
      role: Role.PERSON,
      image: 'http://localhost:123/profile/image',
      eventsParticipant: [{eventId: 2, userId: 1}],
      eventsHosting: [],
    }
    const req = {user: userDto}
    it('should return an ok message', async () => {
      eventService.leave.mockResolvedValueOnce({eventId: 1, userId: 1})

      await expect(controller.leaveEvent(req, 2))
      .resolves
      .toEqual('ok')
    })

    it('should return a status code of 400', async () => {
      eventService.leave.mockRejectedValueOnce(new Error("unexpected error"))

      await expect(controller.leaveEvent(req, 2))
      .rejects
      .toThrow(new HttpException("Could not leave event", HttpStatus.EXPECTATION_FAILED))
    })

    it('should return a status code of 400', async () => {
      eventService.leave.mockResolvedValueOnce({eventId: 1, userId: 1})

      await expect(controller.leaveEvent({}, 2))
      .rejects
      .toThrow(new HttpException("Can't fetch user information", HttpStatus.BAD_REQUEST))
    })
    
    it('should return a status code of 400', async () => {
      eventService.leave.mockResolvedValueOnce({eventId: 1, userId: 1})

      await expect(controller.leaveEvent({user: null}, 2))
      .rejects
      .toThrow(new HttpException("Can't fetch user information", HttpStatus.BAD_REQUEST))
    })

    it('should return a status code of 400', async () => {
      eventService.leave.mockResolvedValueOnce({eventId: 1, userId: 1})

      await expect(controller.leaveEvent(req, 1))
      .rejects
      .toThrow(new HttpException("User is not a participant of the event", HttpStatus.BAD_REQUEST))
    })
  })

  describe('closeEvent', () => {
    const userDto = {
      id: 2,
      name: 'mountain trip',
      age: 19,
      description: 'lets go to the peak of the local mountain',
      status: Status.WAITING,
      hostId: 2,
      createdAt: new Date(),
      repostedId: null,
      date: new Date(),
      groupLink: null,
      comments: [],
      participants: [],
      reposted: null
    }
    const eventDto = {
      id: 2,
      name: 'mountain trip',
      age: 19,
      description: 'lets go to the peak of the local mountain',
      shortDescription: null,
      images: null,
      status: Status.WAITING,
      hostId: 2,
      createdAt: new Date(),
      repostedId: null,
      date: new Date(),
      groupLink: null,
      reposted: null,
      comments: [],
      participants: []
    }
    const req = {user: userDto}

    it('should return ok message', async () => {
      eventService.eventById.mockResolvedValueOnce(eventDto)
      eventService.updateEventStatus.mockResolvedValueOnce();

      await expect(controller.closeEvent(req, 2))
      .resolves
      .toEqual('ok')
    })

    it('should return a status code of 404', async () => {
      eventService.eventById.mockRejectedValueOnce(new Error("unexpected error"))
      eventService.updateEventStatus.mockResolvedValueOnce();

      await expect(controller.closeEvent(req, 2))
      .rejects
      .toThrow(new HttpException("Event not found", HttpStatus.NOT_FOUND))
    })

    it('should return a status code of 417', async () => {
      eventService.eventById.mockResolvedValueOnce(eventDto)
      eventService.updateEventStatus.mockRejectedValueOnce(new Error("unexpected error"))

      await expect(controller.closeEvent(req, 2))
      .rejects
      .toThrow(new HttpException("Can't update event status", HttpStatus.EXPECTATION_FAILED))
    })

    it('should return a status code of 400', async () => {
      eventService.eventById.mockResolvedValueOnce(eventDto)
      eventService.updateEventStatus.mockResolvedValueOnce();

      await expect(controller.closeEvent({}, 2))
      .rejects
      .toThrow(new HttpException("Can't fetch user information", HttpStatus.BAD_REQUEST))
    })
    
    it('should return a status code of 400', async () => {
      eventService.eventById.mockResolvedValueOnce(eventDto)
      eventService.updateEventStatus.mockResolvedValueOnce();

      await expect(controller.closeEvent({user: null}, 2))
      .rejects
      .toThrow(new HttpException("Can't fetch user information", HttpStatus.BAD_REQUEST))
    })

    it('should return a status code of 400', async () => {
      const eventDto = {
        id: 2,
        name: 'mountain trip',
        description: 'lets go to the peak of the local mountain',
        shortDescription: null,
        images: null,
        status: Status.WAITING,
        hostId: 1,
        createdAt: new Date(),
        repostedId: null,
        date: new Date(),
        groupLink: null,
        reposted: null,
        comments: [],
        participants: []
      }
      eventService.eventById.mockResolvedValueOnce(eventDto)
      eventService.updateEventStatus.mockResolvedValueOnce();

      await expect(controller.closeEvent(req, 2))
      .rejects
      .toThrow(new HttpException("User is not the host of the event", HttpStatus.BAD_REQUEST))
    })
  })

  describe('getOfficialEvents', () => {
    const eventList = [
      {
        id: 1,
        name: 'The Ghost of the Opera',
        description: 'official theatre opera',
        status: Status.WAITING,
        createdAt: new Date(),
        date: new Date(),
        reposts: [],
      },
      {
        id: 1,
        name: 'NASCAR race',
        description: 'championship of Vladivostok',
        status: Status.WAITING,
        createdAt: new Date(),
        date: new Date(),
        reposts: [],
      }
    ];
    
    it('should return a list of official events', async () => {
      eventService.eventsOfficial.mockResolvedValueOnce(eventList)

      await expect(controller.getOfficialEvents(1, 5))
      .resolves
      .toStrictEqual(eventList)
    })

    it('should return a status code of 417', async () => {
      eventService.eventsOfficial.mockRejectedValueOnce(new Error("unexpected error"))

      await expect(controller.getOfficialEvents(1, 10))
      .rejects
      .toThrow(new HttpException("Can't fetch official events", HttpStatus.EXPECTATION_FAILED))
    })
  })
});
