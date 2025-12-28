import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as pako from 'pako';
import sharp from 'sharp';
import { ConfigService } from '../config/config.service';
import { EventsService } from '../events/events.service';
import { Diagram, DiagramVersion } from '../entities';

@Injectable()
export class DiagramService {
  private readonly logger = new Logger(DiagramService.name);

  constructor(
    @InjectRepository(Diagram)
    private diagramRepository: Repository<Diagram>,
    @InjectRepository(DiagramVersion)
    private versionRepository: Repository<DiagramVersion>,
    private configService: ConfigService,
    private eventsService: EventsService,
  ) {}

  /**
   * Encode PlantUML code to URL-safe format
   */
  private encode64(data: Uint8Array): string {
    const encode6bit = (b: number): string => {
      if (b < 10) return String.fromCharCode(48 + b);
      b -= 10;
      if (b < 26) return String.fromCharCode(65 + b);
      b -= 26;
      if (b < 26) return String.fromCharCode(97 + b);
      b -= 26;
      if (b === 0) return '-';
      if (b === 1) return '_';
      return '?';
    };

    let result = '';
    for (let i = 0; i < data.length; i += 3) {
      if (i + 2 === data.length) {
        result += encode6bit((data[i] >> 2) & 0x3f);
        result += encode6bit(((data[i] & 0x3) << 4) | ((data[i + 1] >> 4) & 0xf));
        result += encode6bit((data[i + 1] & 0xf) << 2);
      } else if (i + 1 === data.length) {
        result += encode6bit((data[i] >> 2) & 0x3f);
        result += encode6bit((data[i] & 0x3) << 4);
      } else {
        result += encode6bit((data[i] >> 2) & 0x3f);
        result += encode6bit(((data[i] & 0x3) << 4) | ((data[i + 1] >> 4) & 0xf));
        result += encode6bit(((data[i + 1] & 0xf) << 2) | ((data[i + 2] >> 6) & 0x3));
        result += encode6bit(data[i + 2] & 0x3f);
      }
    }
    return result;
  }

  encodeForPlantUml(code: string): string {
    const utf8 = new TextEncoder().encode(code);
    const deflated = pako.deflateRaw(utf8, { level: 9 });
    return this.encode64(deflated);
  }

  getImageUrl(code: string, format: 'png' | 'svg' = 'png'): string {
    const encoded = this.encodeForPlantUml(code);
    return `${this.configService.plantUmlPublicUrl}/${format}/${encoded}`;
  }

  /**
   * Generate a thumbnail from PlantUML code
   * Fetches PNG from PlantUML server, resizes to 400px wide, returns as base64 data URL
   */
  async generateThumbnail(code: string): Promise<string | null> {
    if (!code) return null;

    try {
      const imageUrl = this.getImageUrl(code, 'png');
      const response = await fetch(imageUrl);

      if (!response.ok) {
        this.logger.warn(`Failed to fetch image for thumbnail: ${response.status}`);
        return null;
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      // Resize to max 400px wide, maintaining aspect ratio
      const resized = await sharp(buffer)
        .resize({ width: 400, withoutEnlargement: true })
        .png()
        .toBuffer();

      return `data:image/png;base64,${resized.toString('base64')}`;
    } catch (error) {
      this.logger.error(`Error generating thumbnail: ${error.message}`);
      return null;
    }
  }

  private generateName(): string {
    const now = new Date();
    const date = now.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const time = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `Diagramme ${date} ${time}`;
  }

  /**
   * Extract title from PlantUML code
   */
  private extractTitleFromCode(code: string): string | null {
    const match = code.match(/^\s*title\s+(.+)$/m);
    return match ? match[1].trim() : null;
  }

  /**
   * Create a new diagram
   */
  async create(): Promise<Diagram> {
    const diagram = this.diagramRepository.create({
      name: this.generateName(),
      currentCode: '',
      currentVersion: 0,
    });
    return this.diagramRepository.save(diagram);
  }

  /**
   * List all diagrams
   */
  async findAll(search?: string) {
    const queryBuilder = this.diagramRepository
      .createQueryBuilder('diagram')
      .loadRelationCountAndMap('diagram.versionsCount', 'diagram.versions')
      .loadRelationCountAndMap('diagram.commentsCount', 'diagram.comments')
      .orderBy('diagram.updatedAt', 'DESC');

    if (search) {
      queryBuilder.where(
        "to_tsvector('french', diagram.name || ' ' || diagram.currentCode) @@ plainto_tsquery('french', :search)",
        { search },
      );
    }

    const diagrams = await queryBuilder.getMany();
    return diagrams.map((d) => ({
      id: d.id,
      name: d.name,
      currentVersion: d.currentVersion,
      versionsCount: (d as any).versionsCount || 0,
      commentsCount: (d as any).commentsCount || 0,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      imageUrl: d.thumbnail || null,
    }));
  }

  /**
   * Get a diagram by ID
   */
  async findOne(id: string) {
    const diagram = await this.diagramRepository.findOne({
      where: { id },
    });

    if (!diagram) {
      throw new NotFoundException(`Diagram ${id} not found`);
    }

    // Get latest version for previousCode
    const versions = await this.versionRepository.find({
      where: { diagramId: id },
      order: { versionNumber: 'DESC' },
      take: 2,
    });

    const previousCode = versions.length > 1 ? versions[1].code : null;

    return {
      id: diagram.id,
      name: diagram.name,
      code: diagram.currentCode,
      imageUrl: diagram.currentCode
        ? this.getImageUrl(diagram.currentCode, 'png')
        : null,
      svgUrl: diagram.currentCode
        ? this.getImageUrl(diagram.currentCode, 'svg')
        : null,
      previousCode,
      version: diagram.currentVersion,
      createdAt: diagram.createdAt,
      updatedAt: diagram.updatedAt,
    };
  }

  /**
   * Get or create a diagram by ID
   */
  async getOrCreate(id: string) {
    let diagram = await this.diagramRepository.findOne({ where: { id } });

    if (!diagram) {
      // Create new diagram with the provided ID
      diagram = this.diagramRepository.create({
        id,
        name: this.generateName(),
        currentCode: '',
        currentVersion: 0,
      });
      diagram = await this.diagramRepository.save(diagram);
      this.logger.log(`Created new diagram: ${id}`);
    }

    return this.findOne(id);
  }

  /**
   * Update diagram code (creates a new version)
   */
  async updateCode(id: string, code: string) {
    let diagram = await this.diagramRepository.findOne({ where: { id } });

    if (!diagram) {
      // Create new diagram with the provided ID
      diagram = this.diagramRepository.create({
        id,
        name: this.generateName(),
        currentCode: '',
        currentVersion: 0,
      });
      diagram = await this.diagramRepository.save(diagram);
      this.logger.log(`Created new diagram: ${id}`);
    }

    const previousCode = diagram.currentCode || null;

    // Increment version
    diagram.currentVersion++;
    diagram.currentCode = code;

    // Extract title from PlantUML code and use as diagram name
    const extractedTitle = this.extractTitleFromCode(code);
    if (extractedTitle) {
      diagram.name = extractedTitle;
    }

    // Generate thumbnail
    diagram.thumbnail = await this.generateThumbnail(code);

    await this.diagramRepository.save(diagram);

    // Create version entry
    const version = this.versionRepository.create({
      diagramId: diagram.id,
      versionNumber: diagram.currentVersion,
      code,
    });
    await this.versionRepository.save(version);

    // Cleanup old versions (keep only maxVersions)
    await this.cleanupOldVersions(diagram.id);

    // Emit SSE event
    this.eventsService.emitUpdate(diagram.id, diagram.currentVersion);

    return {
      success: true,
      id: diagram.id,
      imageUrl: this.getImageUrl(code, 'png'),
      svgUrl: this.getImageUrl(code, 'svg'),
      code: diagram.currentCode,
      previousCode,
      version: diagram.currentVersion,
    };
  }

  /**
   * Get all versions of a diagram
   */
  async getVersions(id: string) {
    const diagram = await this.diagramRepository.findOne({ where: { id } });
    if (!diagram) {
      throw new NotFoundException(`Diagram ${id} not found`);
    }

    const versions = await this.versionRepository.find({
      where: { diagramId: id },
      order: { versionNumber: 'DESC' },
    });

    return versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      code: v.code,
      createdAt: v.createdAt,
      isCurrent: v.versionNumber === diagram.currentVersion,
    }));
  }

  /**
   * Restore a specific version (just updates the pointer, doesn't create new version)
   */
  async restoreVersion(id: string, versionNumber: number) {
    const diagram = await this.diagramRepository.findOne({ where: { id } });
    if (!diagram) {
      throw new NotFoundException(`Diagram ${id} not found`);
    }

    const version = await this.versionRepository.findOne({
      where: { diagramId: id, versionNumber },
    });

    if (!version) {
      throw new NotFoundException(
        `Version ${versionNumber} not found for diagram ${id}`,
      );
    }

    // Just update the pointer, don't create a new version
    diagram.currentVersion = versionNumber;
    diagram.currentCode = version.code;
    diagram.thumbnail = await this.generateThumbnail(version.code);
    await this.diagramRepository.save(diagram);

    // Emit SSE event
    this.eventsService.emitUpdate(diagram.id, versionNumber);

    return {
      success: true,
      id: diagram.id,
      imageUrl: this.getImageUrl(version.code, 'png'),
      svgUrl: this.getImageUrl(version.code, 'svg'),
      code: version.code,
      version: versionNumber,
    };
  }

  /**
   * Delete a diagram
   */
  async delete(id: string) {
    const result = await this.diagramRepository.delete(id);
    const affected = result.affected ?? 0;
    return {
      success: affected > 0,
      message: affected > 0 ? 'Diagram deleted' : 'Diagram not found',
    };
  }

  /**
   * Rename a diagram
   */
  async rename(id: string, name: string) {
    const diagram = await this.diagramRepository.findOne({ where: { id } });
    if (!diagram) {
      throw new NotFoundException(`Diagram ${id} not found`);
    }

    diagram.name = name;
    await this.diagramRepository.save(diagram);

    return { success: true, name: diagram.name };
  }

  /**
   * Cleanup old versions keeping only maxVersions
   */
  private async cleanupOldVersions(diagramId: string) {
    const maxVersions = this.configService.maxVersions;

    const versions = await this.versionRepository.find({
      where: { diagramId },
      order: { versionNumber: 'DESC' },
    });

    if (versions.length > maxVersions) {
      const toDelete = versions.slice(maxVersions);
      await this.versionRepository.remove(toDelete);
      this.logger.log(
        `Cleaned up ${toDelete.length} old versions for diagram ${diagramId}`,
      );
    }
  }

  // Legacy method for backward compatibility with old sessionId-based API
  async getDiagram(sessionId: string) {
    return this.getOrCreate(sessionId);
  }

  // Legacy method for backward compatibility
  async updateDiagram(sessionId: string, code: string) {
    return this.updateCode(sessionId, code);
  }

  /**
   * Regenerate thumbnails for all diagrams (migration utility)
   */
  async regenerateAllThumbnails(): Promise<{ processed: number; errors: number }> {
    const diagrams = await this.diagramRepository.find();
    let processed = 0;
    let errors = 0;

    for (const diagram of diagrams) {
      if (diagram.currentCode) {
        try {
          diagram.thumbnail = await this.generateThumbnail(diagram.currentCode);
          await this.diagramRepository.save(diagram);
          processed++;
          this.logger.log(`Regenerated thumbnail for diagram ${diagram.id}`);
        } catch (error) {
          errors++;
          this.logger.error(`Failed to regenerate thumbnail for diagram ${diagram.id}: ${error.message}`);
        }
      }
    }

    return { processed, errors };
  }
}
