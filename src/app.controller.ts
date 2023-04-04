import { BadRequestException, Body, Controller, Delete, Get, HttpException, HttpStatus, Logger, Param, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
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
import { FileInterceptor } from '@nestjs/platform-express';

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
  @UseInterceptors(FileInterceptor('file'))
  async register(@Body() body: {email: string, password: string, name: string}, @UploadedFile() file: Express.Multer.File) {
    const existing = await this.userService.user({email: body.email});
    if (existing) 
      throw new HttpException('User with email address already exists', HttpStatus.BAD_REQUEST);
    const result = await this.userService.createUser({
      name: body.name,
      password: body.password,
      email: body.email,
      role: Role.PERSON
    }, file.buffer);
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
  @UseInterceptors(FileInterceptor('file'))
  async updateProfile(@Req() req, @UploadedFile() file: Express.Multer.File) {
    
  }

  @Post('user/image')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@Req() req, @UploadedFile() file: Express.Multer.File) {
    if (req.user == null)
      throw new BadRequestException("Can't fetch user information")
    const updated = await this.userService.updateUserInfo(req.user, file.buffer)
    return updated
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
      host: {
        connect: {id: req.user.id}
      },
      date: new Date(event.date)
    });
    return result;
  }

  @Post('event/join')
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

  @Post('event/leave')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  async leaveEvent(@Req() req, @Query('id') eventId: string) {
    const user = await this.userService.user({email: req.user.email});
    const id = parseInt(eventId)
    if(user.eventsParticipant.find(event => event.eventId == id) == undefined) {
      throw new BadRequestException("User is not a participant of the event");
    }
    await this.eventService.leave(id, user.id);
    return 'ok'
  }

  @Post('comment')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  async createComment(@Req() req, @Query('eventId') id: string, @Body() comment: {content: string}) {
    const eventId = parseInt(id)
    const result = await this.commentService.create(req.user.id, eventId, comment.content);
    return result;
  }

  @Delete('comment')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  async deleteComment(@Req() req, @Query('id') id: string) {
    const commentId = parseInt(id)
    await this.commentService.delete(req.user, commentId);
    return 'ok'
  }

  @Get('events/official')
  @UseGuards(RoleGuard(Role.PERSON))
  @UseGuards(JwtAuthGuard)
  async getOfficialEvents() {
    return await this.eventService.eventsOfficial();
  }

  
}
