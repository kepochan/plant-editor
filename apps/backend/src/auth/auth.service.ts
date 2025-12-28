import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../entities/member.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(profile: any): Promise<Member | null> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return null;
    }

    const member = await this.memberRepository.findOne({
      where: { email, isActive: true },
    });

    if (!member) {
      return null;
    }

    // Update name if changed
    const name = profile.displayName || profile.name?.givenName;
    if (name && member.name !== name) {
      member.name = name;
      await this.memberRepository.save(member);
    }

    return member;
  }

  async validateJwtUser(payload: JwtPayload): Promise<Member | null> {
    const member = await this.memberRepository.findOne({
      where: { id: payload.sub, isActive: true },
    });
    return member;
  }

  generateToken(member: Member): string {
    const payload: JwtPayload = {
      sub: member.id,
      email: member.email,
      role: member.role,
    };
    return this.jwtService.sign(payload);
  }

  async findMemberByEmail(email: string): Promise<Member | null> {
    return this.memberRepository.findOne({ where: { email } });
  }
}
