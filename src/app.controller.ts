import { BadRequestException, Body, Controller, Get, HttpException, HttpStatus, Logger, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Prisma, Status, User } from '@prisma/client';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import RoleGuard from './auth/role.guard';
import { Role, Roles } from './auth/roles';
import { CommentService } from './comment/comment.service';
import { eventDto } from './Dto/event';
import { EventService } from './event/event.service';
import { UserService } from './user/user.service';

@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly eventService: EventService,
    private readonly commentService: CommentService,
  ) {}

  @Post('auth/login')
  @UseGuards(LocalAuthGuard)
  async login(@Req() req) {
    return await this.authService.login(req.user);
  }

  @Post('auth/register')
  async register(@Query() params: any, @Req() req) {
    console.log(params);
    const existing = await this.userService.user({email: params.email});
    if (existing) 
      throw new HttpException('User with email address already exists', HttpStatus.BAD_REQUEST);
    const result = await this.userService.createUser({
      name: params.name,
      password: params.password,
      email: params.email,
      role: Role.PERSON
    }, req.files);
    return result;
  }

  @Get('profile')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    const profile = await this.userService.user({email: req.user.email});
    return profile;
  }

  @Post('profile')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req) {

  }

  @Post('user/image')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  async uploadImage(@Req() req) {

  }

  @Get('event')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  async getEvent(@Param('id') id) {
    const event = await this.eventService.eventById(id);
    return event;
  }

  @Get('events')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  async getEvents(@Req() req) {
    const result = await this.eventService.events();
    return result;
  }

  @Post('event')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  async createEvent(@Body() event: eventDto, @Req() req) {
    const result = await this.eventService.create({
      name: event.name,
      description: event.description,
      status: Status.WAITING,
      host: req.user,
      date: event.date
    });
    return result;
  }

  @Post('event/join')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  async joinEvent(@Req() req, @Param('id') eventId) {
    const user = await this.userService.user({email: req.user.email});
    if(user.eventsParticipant.find(event => event.eventId == eventId)) {
      throw new BadRequestException("User already joined event");
    }
    return await this.eventService.join(eventId, user.id);
  }

  @Post('event/leave')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  async leaveEvent(@Req() req, @Param('id') eventId) {
    const user = await this.userService.user({email: req.user.email});
    if(user.eventsParticipant.find(event => event.eventId == eventId) == undefined) {
      throw new BadRequestException("User is not a participant of the event");
    }
    return await this.eventService.leave(eventId, user.id);
  }

  @Post('comment')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  async createComment(@Req() req, @Param('eventId') eventId, @Body() body) {
    const comment = await this.commentService.create(req.user.id, eventId, body);
    return comment;
  }

  @Get('events/official')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  async getOfficialEvents() {
    
  }

  
}
