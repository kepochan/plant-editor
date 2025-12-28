import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment, Diagram } from '../entities';
import { EventsService } from '../events/events.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Diagram)
    private diagramRepository: Repository<Diagram>,
    private eventsService: EventsService,
  ) {}

  async getAll(diagramId: string) {
    const comments = await this.commentRepository.find({
      where: { diagramId },
      order: { createdAt: 'ASC' },
    });
    return {
      comments: comments.map((c) => ({
        id: c.id,
        text: c.text,
        startLine: c.startLine,
        endLine: c.endLine,
        codeSnapshot: c.codeSnapshot,
        author: c.author,
        processed: c.processed,
        processedInVersion: c.processedInVersion,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  }

  async getByVersion(diagramId: string) {
    const comments = await this.commentRepository.find({
      where: { diagramId },
      order: { createdAt: 'DESC' },
    });

    // Group comments by processedInVersion
    const byVersion: Record<string, any[]> = {};
    const pending: any[] = [];

    for (const c of comments) {
      const commentData = {
        id: c.id,
        text: c.text,
        startLine: c.startLine,
        endLine: c.endLine,
        codeSnapshot: c.codeSnapshot,
        author: c.author,
        processed: c.processed,
        processedInVersion: c.processedInVersion,
        createdAt: c.createdAt.toISOString(),
      };

      if (!c.processed || c.processedInVersion === null) {
        pending.push(commentData);
      } else {
        const key = `v${c.processedInVersion}`;
        if (!byVersion[key]) {
          byVersion[key] = [];
        }
        byVersion[key].push(commentData);
      }
    }

    return { pending, byVersion };
  }

  async create(dto: CreateCommentDto) {
    // Get diagram to extract code snapshot
    const diagram = await this.diagramRepository.findOne({
      where: { id: dto.sessionId },
    });

    if (!diagram) {
      throw new NotFoundException(`Diagram ${dto.sessionId} not found`);
    }

    // Extract code snapshot for the selected lines
    const lines = diagram.currentCode.split('\n');
    const codeSnapshot = lines.slice(dto.startLine - 1, dto.endLine).join('\n');

    const comment = this.commentRepository.create({
      diagramId: dto.sessionId,
      text: dto.text,
      startLine: dto.startLine,
      endLine: dto.endLine,
      codeSnapshot,
      author: dto.author,
      processed: false,
      processedInVersion: null,
    });

    const saved = await this.commentRepository.save(comment);

    return {
      id: saved.id,
      text: saved.text,
      startLine: saved.startLine,
      endLine: saved.endLine,
      codeSnapshot: saved.codeSnapshot,
      author: saved.author,
      processed: saved.processed,
      processedInVersion: saved.processedInVersion,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async delete(diagramId: string, commentId: string) {
    const result = await this.commentRepository.delete({
      id: commentId,
      diagramId,
    });
    const affected = result.affected ?? 0;
    return {
      success: affected > 0,
      message: affected > 0 ? 'Comment deleted' : 'Comment not found',
    };
  }

  async clearAll(diagramId: string) {
    await this.commentRepository.delete({ diagramId });
    return {
      success: true,
      message: 'All comments cleared',
    };
  }

  async markAsProcessed(diagramId: string, commentId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, diagramId },
    });

    if (!comment) {
      return {
        success: false,
        comment: null,
        message: 'Comment not found',
      };
    }

    // Get current diagram version
    const diagram = await this.diagramRepository.findOne({
      where: { id: diagramId },
    });

    comment.processed = true;
    comment.processedInVersion = diagram?.currentVersion || 0;
    await this.commentRepository.save(comment);

    // Emit SSE event to notify frontend
    this.eventsService.emitComment(diagramId, diagram?.currentVersion || 0);

    return {
      success: true,
      comment: {
        id: comment.id,
        text: comment.text,
        startLine: comment.startLine,
        endLine: comment.endLine,
        codeSnapshot: comment.codeSnapshot,
        author: comment.author,
        processed: comment.processed,
        processedInVersion: comment.processedInVersion,
        createdAt: comment.createdAt.toISOString(),
      },
      message: 'Comment marked as processed',
    };
  }
}
