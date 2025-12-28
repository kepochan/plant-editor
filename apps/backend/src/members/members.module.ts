import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersController } from './members.controller';
import { Member } from '../entities/member.entity';
import { ApiKey } from '../entities/api-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Member, ApiKey])],
  controllers: [MembersController],
})
export class MembersModule {}
