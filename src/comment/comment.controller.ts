import { BadRequestException, Body, Controller, Delete, HttpException, HttpStatus, Logger, Post, Query, Req, UseGuards } from '@nestjs/common';
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
    async createComment(@Req() req, @Query('eventId') id: string, @Body() comment: {content: string}) {
      if(!req.user)
        throw new BadRequestException("Can't fetch user information")
      const eventId = parseInt(id)
      const result = await this.commentService.create(req.user.id, eventId, comment.content)
      .catch(err => {
        this.logger.error(err)
        throw new HttpException("Can't create comment", HttpStatus.EXPECTATION_FAILED)
      })
      return result;
    }

    @Delete()
    async deleteComment(@Req() req, @Query('id') id: string) {
      if(!req.user)
        throw new BadRequestException("Can't fetch user information")
      const commentId = parseInt(id)
      const comment = await this.commentService.commentById(commentId);
      if(comment.authorId != req.user.id)
        throw new BadRequestException("User is not an author of the comment")
      await this.commentService.delete(req.user, commentId)
      .catch(err => {
        this.logger.error(err)
        throw new HttpException("Can't delete comment", HttpStatus.EXPECTATION_FAILED)
      })
      return 'ok'
    }
}
