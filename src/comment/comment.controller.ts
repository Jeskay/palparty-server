import { BadRequestException, Body, Controller, Delete, HttpException, HttpStatus, Logger, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import RoleGuard from '../auth/role.guard';
import { Role } from '../auth/roles';

@Controller('comment')
@UseGuards(RoleGuard(Role.PERSON))
@UseGuards(JwtAuthGuard)
export class CommentController {
    private logger: Logger = new Logger(CommentController.name);
    
    constructor(private readonly commentService: CommentService) {}

    @Post()
    async createComment(@Req() req, @Query('eventId', new ParseIntPipe()) eventId: number, @Body() comment: {content: string}) {
      if(!req.user)
        throw new BadRequestException("Can't fetch user information")
      const result = await this.commentService.create(req.user.id, eventId, comment.content)
      .catch(err => {
        this.logger.error(err)
        throw new HttpException("Can't create comment", HttpStatus.EXPECTATION_FAILED)
      })
      return result;
    }

    @Delete()
    async deleteComment(@Req() req, @Query('id', new ParseIntPipe()) id: number) {
      if(!req.user)
        throw new BadRequestException("Can't fetch user information")
      const comment = await this.commentService.commentById(id);
      if(comment.authorId != req.user.id)
        throw new BadRequestException("User is not an author of the comment")
      await this.commentService.delete(req.user, id)
      .catch(err => {
        this.logger.error(err)
        throw new HttpException("Can't delete comment", HttpStatus.EXPECTATION_FAILED)
      })
      return 'ok'
    }
}
