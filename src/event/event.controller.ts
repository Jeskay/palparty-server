import { BadRequestException, Body, Controller, Get, HttpException, HttpStatus, Logger, NotFoundException, Param, ParseIntPipe, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { EventService } from './event.service';
import RoleGuard from '../auth/role.guard';
import { Role } from '../auth/roles';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventCreateDto } from '../Dto/event';
import { Status } from '@prisma/client';
import { FilterPipe } from './filter.pipe';
import { KeywordPipe } from './keyword.pipe';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@Controller('event')
export class EventController {

  private logger: Logger = new Logger;

    constructor(
        private readonly eventService: EventService,
    ) {}

    @Get()
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async eventById(@Query('id', new ParseIntPipe()) id: number) {
        const event = await this.eventService.eventById(id)
        .catch(err => {
          this.logger.error(err)
          throw new HttpException("Event with provided id was not found", HttpStatus.BAD_REQUEST)
        });
        if(event == null)
          throw new NotFoundException("Event with provided id was not found");
        return event
    }

    @Get('list')
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async getEvents(
      @Query('page', new ParseIntPipe()) page: number, 
      @Query('amount', new ParseIntPipe()) amount: number, 
      @Query('status', new FilterPipe()) status?: Status[], 
      @Query('exclude') exclude: boolean = false,
      @Query('keyword', new KeywordPipe()) keywords?: string[]
    ) {
        const result = await this.eventService.events(page, amount, status, exclude, keywords)
        .catch(err => {
          this.logger.error(err)
          throw new BadRequestException("invalid query params")
        })
        return result;
      }
    
    @Post()
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(AnyFilesInterceptor({limits: {files: 3}}))
    async createEvent(@Body() event: EventCreateDto, @UploadedFiles() files: Express.Multer.File[] = [], @Req() req) {
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
      }, files.filter(file => file.buffer != undefined))
      .catch(err => {
        this.logger.error(err)
        throw new HttpException("Can't create new event", HttpStatus.EXPECTATION_FAILED)
      })
      return result;
    }

    @Post('join')
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async joinEvent(@Req() req, @Query('id', new ParseIntPipe()) id: number) {
      if(!req.user)
        throw new BadRequestException("Can't fetch user information");
      
      if(!req.user.eventsParticipant || req.user.eventsParticipant.find(event => event.id == id))
        throw new BadRequestException("User already joined event");
      
      await this.eventService.join(id, req.user.id)
      .catch(err => {
        this.logger.error(err)
        if(err instanceof HttpException)
          throw err;
        throw new HttpException("Could not join event", HttpStatus.EXPECTATION_FAILED)
      })
      return 'ok'
    }

    @Post('leave')
    @UseGuards(RoleGuard(Role.PERSON))
    @UseGuards(JwtAuthGuard)
    async leaveEvent(@Req() req, @Query('id', new ParseIntPipe()) id: number) {
      if(!req.user)
        throw new BadRequestException("Can't fetch user information");
        if( !req.user.eventsParticipant || (req.user.eventsParticipant.find(event => event.eventId == id) == undefined))
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
    async closeEvent(@Req() req, @Query('id', new ParseIntPipe()) id: number) {
      if(!req.user)
        throw new BadRequestException("Can't fetch user information");
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
      @Query('page', new ParseIntPipe()) page: number, 
      @Query('amount', new ParseIntPipe()) amount?: number, 
      @Query('status', new FilterPipe()) status?: Status[], 
      @Query('exclude') exclude: boolean = false
    ) {
      const events = await this.eventService.eventsOfficial(page, amount, status, exclude)
      .catch(err => {
        this.logger.error(err)
        throw new HttpException("Can't fetch official events", HttpStatus.EXPECTATION_FAILED)
      })

      return events
    }
}
