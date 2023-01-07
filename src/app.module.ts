import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { appProviders } from './app.provider';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { WsAuthModule } from './ws-auth/ws-auth.module';

import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { TodosModule } from './todos/todos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    WsAuthModule,
    UsersModule,
    RolesModule,
    TodosModule,
  ],
  controllers: [AppController],
  providers: [...appProviders, AppService],
})
export class AppModule {}
