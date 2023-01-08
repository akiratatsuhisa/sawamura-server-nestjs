import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import { WsAuthGateway } from 'src/ws-auth/ws-auth.gateway';
import { WsAuthService } from 'src/ws-auth/ws-auth.service';
import { SocketWithAuth } from 'src/ws-auth/ws-auth.type';

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
  ) {
    super(configService, wsAuthService);
  }

  @SubscribeMessage('message')
  handleMessage(): WsResponse<string> {
    return { event: 'message', data: 'Hello world' };
  }

  @SubscribeMessage('create_room')
  async createRoom(
    @MessageBody() dto: CreateRoomDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    //
  }

  @SubscribeMessage('update_room')
  async updateRoom(
    @MessageBody() dto: UpdateRoomDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    //
  }

  @SubscribeMessage('delete_room')
  async deleteRoom(
    @MessageBody() dto: DeleteRoomDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    //
  }

  @SubscribeMessage('create_member')
  async createMember(
    @MessageBody() dto: CreateMemberDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    //
  }

  @SubscribeMessage('update_member')
  async updateMember(
    @MessageBody() dto: UpdateMemberDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    //
  }

  @SubscribeMessage('delete_member')
  async deleteMember(
    @MessageBody() dto: DeleteMemberDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    //
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
