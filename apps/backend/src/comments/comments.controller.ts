import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller()
@UseGuards(ApiKeyGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // ===== New REST API endpoints =====

  @Get('diagrams/:diagramId/comments')
  getAllNew(@Param('diagramId') diagramId: string) {
    return this.commentsService.getAll(diagramId);
  }

  @Get('diagrams/:diagramId/comments/by-version')
  getByVersion(@Param('diagramId') diagramId: string) {
    return this.commentsService.getByVersion(diagramId);
  }

  @Post('diagrams/:diagramId/comments')
  createNew(
    @Param('diagramId') diagramId: string,
    @Body() body: { text: string; startLine: number; endLine: number; author?: string },
  ) {
    return this.commentsService.create({
      sessionId: diagramId,
      text: body.text,
      startLine: body.startLine,
      endLine: body.endLine,
      author: body.author,
    });
  }

  @Patch('diagrams/:diagramId/comments/:id/processed')
  markAsProcessedNew(
    @Param('diagramId') diagramId: string,
    @Param('id') id: string,
  ) {
    return this.commentsService.markAsProcessed(diagramId, id);
  }

  @Delete('diagrams/:diagramId/comments/:id')
  deleteNew(
    @Param('diagramId') diagramId: string,
    @Param('id') id: string,
  ) {
    return this.commentsService.delete(diagramId, id);
  }

  @Delete('diagrams/:diagramId/comments')
  clearAllNew(@Param('diagramId') diagramId: string) {
    return this.commentsService.clearAll(diagramId);
  }

  // ===== Legacy endpoints for backward compatibility =====

  @Get('comments')
  getAll(@Query('sessionId') sessionId: string) {
    return this.commentsService.getAll(sessionId);
  }

  @Post('comments')
  create(@Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(createCommentDto);
  }

  @Patch('comments/:id/processed')
  markAsProcessed(
    @Param('id') id: string,
    @Query('sessionId') sessionId: string,
  ) {
    return this.commentsService.markAsProcessed(sessionId, id);
  }

  @Delete('comments/:id')
  delete(
    @Param('id') id: string,
    @Query('sessionId') sessionId: string,
  ) {
    return this.commentsService.delete(sessionId, id);
  }

  @Delete('comments')
  clearAll(@Query('sessionId') sessionId: string) {
    return this.commentsService.clearAll(sessionId);
  }
}
