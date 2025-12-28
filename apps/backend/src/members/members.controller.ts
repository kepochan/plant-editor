import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Member } from '../entities/member.entity';
import { ApiKey } from '../entities/api-key.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface CreateMemberDto {
  email: string;
  name?: string;
  role?: string;
}

interface UpdateMemberDto {
  name?: string;
  role?: string;
  isActive?: boolean;
}

interface CreateApiKeyDto {
  name?: string;
}

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  private checkAdmin(req: any) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Get()
  async findAll(@Req() req: any): Promise<Member[]> {
    this.checkAdmin(req);
    return this.memberRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  @Get('me')
  async getMe(@Req() req: any): Promise<Member> {
    return req.user;
  }

  @Post()
  async create(
    @Body() createMemberDto: CreateMemberDto,
    @Req() req: any,
  ): Promise<Member> {
    this.checkAdmin(req);

    const existing = await this.memberRepository.findOne({
      where: { email: createMemberDto.email },
    });

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        existing.isActive = true;
        existing.addedBy = req.user.email;
        return this.memberRepository.save(existing);
      }
      return existing;
    }

    const member = this.memberRepository.create({
      email: createMemberDto.email.toLowerCase(),
      name: createMemberDto.name,
      role: createMemberDto.role || 'user',
      addedBy: req.user.email,
    });

    return this.memberRepository.save(member);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @Req() req: any,
  ): Promise<Member> {
    this.checkAdmin(req);

    const member = await this.memberRepository.findOne({ where: { id } });
    if (!member) {
      throw new ForbiddenException('Member not found');
    }

    // Prevent admin from removing their own admin role
    if (member.id === req.user.id && updateMemberDto.role === 'user') {
      throw new ForbiddenException('Cannot remove your own admin role');
    }

    Object.assign(member, updateMemberDto);
    return this.memberRepository.save(member);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    this.checkAdmin(req);

    const member = await this.memberRepository.findOne({ where: { id } });
    if (!member) {
      return;
    }

    // Prevent admin from deleting themselves
    if (member.id === req.user.id) {
      throw new ForbiddenException('Cannot delete yourself');
    }

    await this.memberRepository.remove(member);
  }

  // ===== My API Keys (self-management) =====

  @Get('me/api-keys')
  async getMyApiKeys(@Req() req: any): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({
      where: { memberId: req.user.id },
      order: { createdAt: 'DESC' },
    });
  }

  @Post('me/api-keys')
  async createMyApiKey(
    @Body() createApiKeyDto: CreateApiKeyDto,
    @Req() req: any,
  ): Promise<{ apiKey: ApiKey; key: string }> {
    const key = randomBytes(32).toString('hex');

    const apiKey = this.apiKeyRepository.create({
      key,
      name: createApiKeyDto.name || `API Key ${new Date().toLocaleDateString()}`,
      memberId: req.user.id,
    });

    const saved = await this.apiKeyRepository.save(apiKey);
    return { apiKey: saved, key };
  }

  @Delete('me/api-keys/:keyId')
  async deleteMyApiKey(
    @Param('keyId') keyId: string,
    @Req() req: any,
  ): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: keyId, memberId: req.user.id },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    await this.apiKeyRepository.remove(apiKey);
  }

  // ===== API Keys Management (admin) =====

  @Get(':memberId/api-keys')
  async getApiKeys(
    @Param('memberId') memberId: string,
    @Req() req: any,
  ): Promise<ApiKey[]> {
    this.checkAdmin(req);

    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return this.apiKeyRepository.find({
      where: { memberId },
      order: { createdAt: 'DESC' },
    });
  }

  @Post(':memberId/api-keys')
  async createApiKey(
    @Param('memberId') memberId: string,
    @Body() createApiKeyDto: CreateApiKeyDto,
    @Req() req: any,
  ): Promise<{ apiKey: ApiKey; key: string }> {
    this.checkAdmin(req);

    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const key = randomBytes(32).toString('hex');

    const apiKey = this.apiKeyRepository.create({
      key,
      name: createApiKeyDto.name || `API Key ${new Date().toLocaleDateString()}`,
      memberId,
    });

    const saved = await this.apiKeyRepository.save(apiKey);
    return { apiKey: saved, key };
  }

  @Delete(':memberId/api-keys/:keyId')
  async deleteApiKey(
    @Param('memberId') memberId: string,
    @Param('keyId') keyId: string,
    @Req() req: any,
  ): Promise<void> {
    this.checkAdmin(req);

    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: keyId, memberId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    await this.apiKeyRepository.remove(apiKey);
  }
}
