import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import { RoomMemberRole } from '@prisma/client';
import * as _ from 'lodash';
import { RedisService } from 'src/redis/redis.service';
import { PREFIXES } from 'src/ws-auth/constants';
import { WsAuthGateway } from 'src/ws-auth/ws-auth.gateway';
import { WsAuthService } from 'src/ws-auth/ws-auth.service';
import { IdentityUser, User } from 'src/ws-auth/ws-users.decorator';

import {
  CreateMemberDto,
  CreateMessageDto,
  CreateRoomDto,
  DeleteMemberDto,
  DeleteMessageDto,
  DeleteRoomDto,
  UpdateMemberDto,
  UpdateMessageDto,
  UpdateRoomDto,
} from './dtos';
import { RoomsService } from './rooms.service';

@Injectable()
@WebSocketGateway({ namespace: 'chat' })
export class RoomsGateway extends WsAuthGateway {
  constructor(
    configService: ConfigService,
    wsAuthService: WsAuthService,
    private roomsService: RoomsService,
    private redisService: RedisService,
  ) {
    super(configService, wsAuthService);
  }

  private emitToMembers(
    event: string,
    room: Awaited<ReturnType<RoomsService['getRoomById']>>,
  ) {
    this.namespace
      .to(
        _(room.roomMembers)
          .filter((m) => m.role !== RoomMemberRole.None)
          .map((m) => `${PREFIXES.SOCKET_USER}:${m.member.id}`)
          .value(),
      )
      .emit(event, room);
  }

  @SubscribeMessage('message')
  handleMessage(): WsResponse<string> {
    return { event: 'message', data: 'Hello world' };
  }

  @SubscribeMessage('create:room')
  async createRoom(
    @MessageBody() dto: CreateRoomDto,
    @User() user: IdentityUser,
  ) {
    const room = await this.roomsService.createRoom(dto, user);

    this.emitToMembers('create:room', room);
  }

  @SubscribeMessage('update:room')
  async updateRoom(
    @MessageBody() dto: UpdateRoomDto,
    @User() user: IdentityUser,
  ) {
    const room = await this.roomsService.updateRoom(dto, user);

    this.emitToMembers('update:room', room);
  }

  @SubscribeMessage('delete:room')
  async deleteRoom(
    @MessageBody() dto: DeleteRoomDto,
    @User() user: IdentityUser,
  ) {
    const room = await this.roomsService.deleteRoom(dto, user);

    this.emitToMembers('delete:room', room);
  }

  @SubscribeMessage('create:member')
  async createMember(
    @MessageBody() dto: CreateMemberDto,
    @User() user: IdentityUser,
  ) {
    const room = await this.roomsService.createMember(dto, user);

    this.emitToMembers('create:member', room);
  }

  @SubscribeMessage('update:member')
  async updateMember(
    @MessageBody() dto: UpdateMemberDto,
    @User() user: IdentityUser,
  ) {
    const room = await this.roomsService.updateMember(dto, user);

    this.emitToMembers('update:member', room);
  }

  @SubscribeMessage('delete:member')
  async deleteMember(
    @MessageBody() dto: DeleteMemberDto,
    @User() user: IdentityUser,
  ) {
    const room = await this.roomsService.deleteMember(dto, user);

    this.emitToMembers('delete:member', room);
  }

  @SubscribeMessage('create:message')
  async createMessage(
    @MessageBody() dto: CreateMessageDto,
    @User() user: IdentityUser,
  ) {
    const message = await this.roomsService.createMessage(dto, user);

    this.sendToUsers({
      event: 'create:message',
      userIds: _.map(message.room.roomMembers, 'memberId'),
      data: message,
      unconnectedCallback: async (unconnected) =>
        console.log(`Send notification to ${unconnected.join(',')}`),
    });
  }

  @SubscribeMessage('update:message')
  async updateMessage(
    @MessageBody() dto: UpdateMessageDto,
    @User() user: IdentityUser,
  ) {
    const message = await this.roomsService.updateMessage(dto, user);

    this.sendToUsers({
      event: 'update:message',
      userIds: _.map(message.room.roomMembers, 'memberId'),
      data: message,
      unconnectedCallback: async (unconnected) =>
        console.log(`Send notification to ${unconnected.join(',')}`),
    });
  }

  @SubscribeMessage('delete:message')
  async deleteMessage(
    @MessageBody() dto: DeleteMessageDto,
    @User() user: IdentityUser,
  ) {
    const message = await this.roomsService.deleteMessage(dto, user);

    this.sendToUsers({
      event: 'delete:message',
      userIds: _.map(message.room.roomMembers, 'memberId'),
      data: message,
      unconnectedCallback: async (unconnected) =>
        console.log(`Send notification to ${unconnected.join(',')}`),
    });
  }
}
