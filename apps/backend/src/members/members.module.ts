import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersController } from './members.controller';
import { Member } from '../entities/member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Member])],
  controllers: [MembersController],
})
export class MembersModule {}
