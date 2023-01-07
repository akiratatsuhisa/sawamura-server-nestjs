import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { appProviders } from './app.provider';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RolesModule } from './roles/roles.module';
import { RoomsModule } from './rooms/rooms.module';
import { TodosModule } from './todos/todos.module';
import { UsersModule } from './users/users.module';
import { WsAuthModule } from './ws-auth/ws-auth.module';

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
    RoomsModule,
  ],
  controllers: [AppController],
  providers: [...appProviders, AppService],
})
export class AppModule {}
