import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '../config/config.service';
import { ConfigModule } from '../config/config.module';
import { Diagram, DiagramVersion, Comment, Member } from '../entities';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.databaseHost,
        port: configService.databasePort,
        username: configService.databaseUser,
        password: configService.databasePassword,
        database: configService.databaseName,
        entities: [Diagram, DiagramVersion, Comment, Member],
        synchronize: true, // Auto-create tables in development
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),
    TypeOrmModule.forFeature([Diagram, DiagramVersion, Comment, Member]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
