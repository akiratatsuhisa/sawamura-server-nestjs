import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppGateway } from './app.gateway';
import { appProviders } from './app.provider';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DropboxModule } from './dropbox/dropbox.module';
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
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
        keyPrefix: 'queue',
      },
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    WsAuthModule,
    DropboxModule,
    SendgridModule,
    UsersModule,
    RolesModule,
    TodosModule,
    RoomsModule,
    VerificationTokensModule,
  ],
  controllers: [AppController],
  providers: [...appProviders, AppService, AppGateway],
})
export class AppModule {}
