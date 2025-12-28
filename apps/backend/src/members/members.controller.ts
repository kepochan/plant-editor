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
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../entities/member.entity';
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

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
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
}
