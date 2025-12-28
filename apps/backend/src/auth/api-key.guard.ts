import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '../config/config.service';
import { ApiKey } from '../entities/api-key.entity';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] || request.query.api_key;

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    // First check environment variable API keys (for backward compatibility)
    if (this.configService.apiKeys.includes(apiKey)) {
      return true;
    }

    // Then check database API keys
    const dbApiKey = await this.apiKeyRepository.findOne({
      where: { key: apiKey },
      relations: ['member'],
    });

    if (!dbApiKey || !dbApiKey.member?.isActive) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Update last used timestamp
    dbApiKey.lastUsedAt = new Date();
    await this.apiKeyRepository.save(dbApiKey);

    return true;
  }
}
