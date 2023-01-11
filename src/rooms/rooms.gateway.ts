import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import { RoomMemberRole } from '@prisma/client';
import * as _ from 'lodash';
import { RedisService } from 'src/redis/redis.service';
import { PREFIX_SOCKET_USER } from 'src/ws-auth/constants';
import { WsAuthGateway } from 'src/ws-auth/ws-auth.gateway';
import { WsAuthService } from 'src/ws-auth/ws-auth.service';
import { SocketWithAuth } from 'src/ws-auth/ws-auth.type';
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
          .map((m) => `${PREFIX_SOCKET_USER}${m.member.id}`)
          .value(),
      )
      .emit(event, room);
  }

  @SubscribeMessage('message')
  handleMessage(): WsResponse<string> {
    return { event: 'message', data: 'Hello world' };
  }

  @SubscribeMessage('create_room')
  async createRoom(
    @MessageBody() dto: CreateRoomDto,
    @User() user: IdentityUser,
  ) {
    const room = await this.roomsService.createRoom(dto, user);

    this.emitToMembers('create_room', room);
  }

  @SubscribeMessage('update_room')
  async updateRoom(
    @MessageBody() dto: UpdateRoomDto,
    @User() user: IdentityUser,
  ) {
    const room = await this.roomsService.updateRoom(dto, user);

    this.emitToMembers('update_room', room);
  }

  @SubscribeMessage('delete_room')
  async deleteRoom(
    @MessageBody() dto: DeleteRoomDto,
    @User() user: IdentityUser,
  ) {
    const room = await this.roomsService.deleteRoom(dto, user);

    this.emitToMembers('delete_room', room);
  }

  @SubscribeMessage('create_member')
  async createMember(
    @MessageBody() dto: CreateMemberDto,
    @User() user: IdentityUser,
  ) {
    const room = await this.roomsService.createMember(dto, user);

    this.emitToMembers('create_member', room);
  }

  @SubscribeMessage('update_member')
  async updateMember(
    @MessageBody() dto: UpdateMemberDto,
    @User() user: IdentityUser,
  ) {
    const room = await this.roomsService.updateMember(dto, user);

    this.emitToMembers('update_member', room);
  }

  @SubscribeMessage('delete_member')
  async deleteMember(
    @MessageBody() dto: DeleteMemberDto,
    @User() user: IdentityUser,
  ) {
    const room = await this.roomsService.deleteMember(dto, user);

    this.emitToMembers('delete_member', room);
  }

  @SubscribeMessage('create_message')
  async createMessage(
    @MessageBody() dto: CreateMessageDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    //
  }

  @SubscribeMessage('update_message')
  async updateMessage(
    @MessageBody() dto: UpdateMessageDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    //
  }

  @SubscribeMessage('delete_message')
  async deleteMessage(
    @MessageBody() dto: DeleteMessageDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    //
  }
}
