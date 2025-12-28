import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '../config/config.service';
import { Member } from '../entities/member.entity';

@Injectable()
export class InitAdminService implements OnModuleInit {
  private readonly logger = new Logger(InitAdminService.name);

  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const adminEmail = this.configService.adminEmail;
    if (!adminEmail) {
      this.logger.warn('ADMIN_EMAIL not set, skipping admin initialization');
      return;
    }

    const existingAdmin = await this.memberRepository.findOne({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const admin = this.memberRepository.create({
        email: adminEmail.toLowerCase(),
        role: 'admin',
        isActive: true,
        addedBy: 'system',
      });
      await this.memberRepository.save(admin);
      this.logger.log(`Admin user created: ${adminEmail}`);
    } else {
      this.logger.log(`Admin user already exists: ${adminEmail}`);
    }
  }
}
