import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppGateway } from './app.gateway';
import { appProviders } from './app.provider';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DropboxModule } from './dropbox/dropbox.module';
import { FileUtilsModule } from './file-utils/file-utils.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RolesModule } from './roles/roles.module';
import { RoomsModule } from './rooms/rooms.module';
import { SendgridModule } from './sendgrid/sendgrid.module';
import { TodosModule } from './todos/todos.module';
import { UsersModule } from './users/users.module';
import { VerificationTokensModule } from './verification-tokens/verification-tokens.module';
import { WsAuthModule } from './ws-auth/ws-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: configService.get('REDIS_URL'),
        prefix: 'queue',
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    WsAuthModule,
    DropboxModule,
    SendgridModule,
    FileUtilsModule,
    UsersModule,
    RolesModule,
    VerificationTokensModule,
    DashboardModule,
    RoomsModule,
    NotificationsModule,
    TodosModule,
  ],
  controllers: [AppController],
  providers: [...appProviders, AppService, AppGateway],
})
export class AppModule {}
