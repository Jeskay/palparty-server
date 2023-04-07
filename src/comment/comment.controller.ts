import { Body, Controller, Delete, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import RoleGuard from '../auth/role.guard';
import { Role } from '../auth/roles';

@Controller('comment')
@UseGuards(RoleGuard(Role.PERSON))
@UseGuards(JwtAuthGuard)
export class CommentController {
    constructor(private readonly commentService: CommentService) {}

    @Post()
    async createComment(@Req() req, @Query('eventId') id: string, @Body() comment: {content: string}) {
      const eventId = parseInt(id)
      const result = await this.commentService.create(req.user.id, eventId, comment.content);
      return result;
    }

    @Delete()
    async deleteComment(@Req() req, @Query('id') id: string) {
      const commentId = parseInt(id)
      await this.commentService.delete(req.user, commentId);
      return 'ok'
    }
}
