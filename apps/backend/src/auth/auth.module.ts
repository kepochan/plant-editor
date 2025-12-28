import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyGuard } from './api-key.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { InitAdminService } from './init-admin.service';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { Member } from '../entities/member.entity';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.jwtSecret,
        signOptions: { expiresIn: '24h' },
      }),
    }),
    TypeOrmModule.forFeature([Member]),
  ],
  controllers: [AuthController],
  providers: [ApiKeyGuard, AuthService, GoogleStrategy, JwtStrategy, InitAdminService],
  exports: [ApiKeyGuard, AuthService, JwtModule],
})
export class AuthModule {}
