import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { EventService } from './event.service';
import RoleGuard from '../auth/role.guard';
import { Role } from '../auth/roles';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { eventDto } from '../Dto/event';
import { Status } from '@prisma/client';

@Controller('event')
export class EventController {
    constructor(
        private readonly eventService: EventService,
    ) {}

    @Get()
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async eventById(@Query('id') id) {
        const eventId = parseInt(id)
        const event = await this.eventService.eventById(eventId)
        return event
    }

    @Get('list')
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async getEvents(
      @Req() req, 
      @Query('page') page: string, 
      @Query('amount') amount?: string, 
      @Query('status') status?: string, 
      @Query('exclude') exclude: boolean = false
    ) {
        const pageN = parseInt(page)
        const pageSize = !amount ? undefined : parseInt(amount)
        const filter = !status ? undefined : status.split(',').filter(str => Object.values(Status).includes(str as Status))
        const result = await this.eventService.events(pageN, pageSize, filter as Status[], exclude);
        return result;
      }
    
    @Post()
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async createEvent(@Body() event: eventDto, @Req() req) {
      const result = await this.eventService.create({
        name: event.name,
        description: event.description,
        status: Status.WAITING,
        host: {
          connect: {id: req.user.id}
        },
        date: new Date(event.date)
      });
      return result;
    }

    @Post('join')
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async joinEvent(@Req() req, @Query('id') eventId: string) {
      if(req.user == null) {
        throw new BadRequestException("Can't fetch user information");
      }
      if(req.user.eventsParticipant.find(event => event.eventId == eventId)) {
        throw new BadRequestException("User already joined event");
      }
      console.log(eventId);
      await this.eventService.join(parseInt(eventId), req.user.id);
      return 'ok'
    }

    @Post('leave')
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async leaveEvent(@Req() req, @Query('id') eventId: string) {
        if(req.user == null) {
          throw new BadRequestException("Can't fetch user information");
        }
        const id = parseInt(eventId)
        if(req.user.eventsParticipant.find(event => event.eventId == id) == undefined) {
          throw new BadRequestException("User is not a participant of the event");
        }
        await this.eventService.leave(id, req.user.id);
        return 'ok'
    }
    
    @Post('close')
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async closeEvent(@Req() req, @Query('id') eventId: string) {
      if(req.user == null)
        throw new BadRequestException("Can't fetch user information");
      const id = parseInt(eventId)
      const event = await this.eventService.eventById(id)
      if(event.hostId != req.user.id)
        throw new BadRequestException("")
      await this.eventService.updateEventStatus(id, Status.PREPARING);
      return 'ok'
    }
    
    @Get('official')
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async getOfficialEvents() {
      return await this.eventService.eventsOfficial();
    }
}
