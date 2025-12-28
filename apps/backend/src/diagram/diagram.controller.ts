import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { DiagramService } from './diagram.service';
import { CreateDiagramDto } from './dto/create-diagram.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { EventsService } from '../events/events.service';

@Controller()
export class DiagramController {
  constructor(
    private readonly diagramService: DiagramService,
    private readonly eventsService: EventsService,
  ) {}

  // ===== New REST API endpoints =====

  @Get('diagrams')
  @UseGuards(ApiKeyGuard)
  findAll(@Query('search') search?: string) {
    return this.diagramService.findAll(search);
  }

  @Post('diagrams')
  @UseGuards(ApiKeyGuard)
  create() {
    return this.diagramService.create();
  }

  @Get('diagrams/:id')
  @UseGuards(ApiKeyGuard)
  findOne(@Param('id') id: string) {
    return this.diagramService.findOne(id);
  }

  @Delete('diagrams/:id')
  @UseGuards(ApiKeyGuard)
  delete(@Param('id') id: string) {
    return this.diagramService.delete(id);
  }

  @Patch('diagrams/:id/name')
  @UseGuards(ApiKeyGuard)
  rename(@Param('id') id: string, @Body('name') name: string) {
    return this.diagramService.rename(id, name);
  }

  @Post('diagrams/:id/code')
  @UseGuards(ApiKeyGuard)
  updateCode(@Param('id') id: string, @Body('code') code: string) {
    return this.diagramService.updateCode(id, code);
  }

  @Get('diagrams/:id/versions')
  @UseGuards(ApiKeyGuard)
  getVersions(@Param('id') id: string) {
    return this.diagramService.getVersions(id);
  }

  @Post('diagrams/:id/restore/:version')
  @UseGuards(ApiKeyGuard)
  restoreVersion(
    @Param('id') id: string,
    @Param('version') version: string,
  ) {
    return this.diagramService.restoreVersion(id, parseInt(version, 10));
  }

  @Sse('diagrams/:id/events')
  eventsNew(@Param('id') id: string): Observable<MessageEvent> {
    return this.eventsService.getEventsForSession(id);
  }

  @Post('diagrams/regenerate-thumbnails')
  @UseGuards(ApiKeyGuard)
  regenerateThumbnails() {
    return this.diagramService.regenerateAllThumbnails();
  }

  // ===== Legacy endpoints for backward compatibility =====

  @Post('diagram')
  @UseGuards(ApiKeyGuard)
  createLegacy(@Body() createDiagramDto: CreateDiagramDto) {
    return this.diagramService.updateDiagram(
      createDiagramDto.sessionId,
      createDiagramDto.code,
    );
  }

  @Get('diagram')
  @UseGuards(ApiKeyGuard)
  getLegacy(@Query('sessionId') sessionId: string) {
    return this.diagramService.getDiagram(sessionId);
  }

  @Sse('diagram/events')
  eventsLegacy(@Query('sessionId') sessionId: string): Observable<MessageEvent> {
    return this.eventsService.getEventsForSession(sessionId);
  }
}
