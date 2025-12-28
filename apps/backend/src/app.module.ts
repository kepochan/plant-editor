import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { DiagramModule } from './diagram/diagram.module';
import { CommentsModule } from './comments/comments.module';
import { HealthModule } from './health/health.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    DiagramModule,
    CommentsModule,
    HealthModule,
    EventsModule,
  ],
})
export class AppModule {}
