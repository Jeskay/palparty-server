import { BadRequestException, Body, Controller, Get, HttpException, HttpStatus, Logger, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { EventService } from './event.service';
import RoleGuard from '../auth/role.guard';
import { Role } from '../auth/roles';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { eventDto } from '../Dto/event';
import { Status } from '@prisma/client';

@Controller('event')
export class EventController {

  private logger: Logger = new Logger;

    constructor(
        private readonly eventService: EventService,
    ) {}

    @Get()
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async eventById(@Query('id') id) {
        const eventId = parseInt(id)
        const event = await this.eventService.eventById(eventId)
        .catch(err => {
          this.logger.error(err)
          throw new HttpException("Event with provided id was not found", HttpStatus.BAD_REQUEST)
        })
        return event
    }

    @Get('list')
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async getEvents(
      @Query('page') page: string, 
      @Query('amount') amount?: string, 
      @Query('status') status?: string, 
      @Query('exclude') exclude: boolean = false
    ) {
        const pageN = parseInt(page)
        const pageSize = !amount ? undefined : parseInt(amount)
        const filter = !status ? undefined : status.split(',').filter(str => Object.values(Status).includes(str as Status))
        const result = await this.eventService.events(pageN, pageSize, filter as Status[], exclude)
        .catch(err => {
          this.logger.error(err)
          throw new BadRequestException("invalid query params")
        })
        return result;
      }
    
    @Post()
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async createEvent(@Body() event: eventDto, @Req() req) {
      if(!req.user)
        throw new BadRequestException("Can't fetch user information");
      
      const result = await this.eventService.create({
        name: event.name,
        description: event.description,
        status: Status.WAITING,
        host: {
          connect: {id: req.user.id}
        },
        date: new Date(event.date)
      })
      .catch(err => {
        this.logger.error(err)
        throw new HttpException("Can't create new event", HttpStatus.EXPECTATION_FAILED)
      })
      return result;
    }

    @Post('join')
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async joinEvent(@Req() req, @Query('id') eventId: string) {
      if(!req.user)
        throw new BadRequestException("Can't fetch user information");
      
      const id = parseInt(eventId)
      if(!req.user.eventsParticipant || req.user.eventsParticipant.find(event => event.id == id))
        throw new BadRequestException("User already joined event");
      
      await this.eventService.join(parseInt(eventId), req.user.id)
      .catch(err => {
        this.logger.error(err)
        throw new HttpException("Could not join event", HttpStatus.EXPECTATION_FAILED)
      })
      return 'ok'
    }

    @Post('leave')
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async leaveEvent(@Req() req, @Query('id') eventId: string) {
      if(!req.user)
        throw new BadRequestException("Can't fetch user information");
      
      const id = parseInt(eventId)
      if( !req.user.eventsParticipant || req.user.eventsParticipant.find(event => event.id == id) == undefined)
        throw new BadRequestException("User is not a participant of the event");
      
      await this.eventService.leave(id, req.user.id)
      .catch(err => {
        this.logger.error(err)
        throw new HttpException("Could not leave event", HttpStatus.EXPECTATION_FAILED)
      })
      return 'ok'
    }
    
    @Post('close')
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async closeEvent(@Req() req, @Query('id') eventId: string) {
      if(!req.user)
        throw new BadRequestException("Can't fetch user information");
      const id = parseInt(eventId)
      const event = await this.eventService.eventById(id)
      .catch(err => {
        this.logger.error(err);
        throw new HttpException("Event not found", HttpStatus.NOT_FOUND)
      })
      if(event.hostId != req.user.id)
        throw new BadRequestException("User is not the host of the event")
      await this.eventService.updateEventStatus(id, Status.PREPARING)
      .catch(err => {
        this.logger.log(err)
        throw new HttpException("Can't update event status", HttpStatus.EXPECTATION_FAILED)
      })
      return 'ok'
    }
    
    @Get('official')
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async getOfficialEvents(
      @Query('page') page: string, 
      @Query('amount') amount?: string, 
      @Query('status') status?: string, 
      @Query('exclude') exclude: boolean = false
    ) {
      const pageN = parseInt(page)
        const pageSize = !amount ? undefined : parseInt(amount)
        const filter = !status ? undefined : status.split(',').filter(str => Object.values(Status).includes(str as Status))

      const events = await this.eventService.eventsOfficial(pageN, pageSize, filter as Status[], exclude)
      .catch(err => {
        this.logger.error(err)
        throw new HttpException("Can't fetch official events", HttpStatus.EXPECTATION_FAILED)
      })

      return events
    }
}
