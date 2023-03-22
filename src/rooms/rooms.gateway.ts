import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import { RoomMemberRole, RoomMessageType } from '@prisma/client';
import * as _ from 'lodash';
import { AppError } from 'src/common/errors';
import { IFile } from 'src/helpers/file-type.interface';
import { WsAuthGateway } from 'src/ws-auth/ws-auth.gateway';
import { WsAuthService } from 'src/ws-auth/ws-auth.service';
import { SocketWithAuth } from 'src/ws-auth/ws-auth.types';

import { SOCKET_ROOM_EVENTS } from './constants';
import {
  CreateMemberDto,
  CreateMessageDto,
  CreateRoomDto,
  DeleteMemberDto,
  DeleteMessageDto,
  DeleteRoomDto,
  SearchMessagesDto,
  SearchRoomDto,
  SearchRoomsDto,
  UpdateMemberDto,
  UpdateMessageDto,
  UpdateRoomDto,
} from './dtos';
import { RoomsService } from './rooms.service';

@Injectable()
@WebSocketGateway({
  namespace: 'chat',
})
export class RoomsGateway extends WsAuthGateway {
  constructor(
    configService: ConfigService,
    wsAuthService: WsAuthService,
    private roomsService: RoomsService,
  ) {
    super(configService, wsAuthService);
  }

  private getRoomMembers(
    room: Awaited<ReturnType<RoomsService['getRoomById']>>,
  ) {
    return _(room.roomMembers)
      .filter((m) => m.role !== RoomMemberRole.None)
      .map((m) => m.member.id)
      .value();
  }

  @SubscribeMessage('message')
  handleMessage(): WsResponse<string> {
    return { event: 'message', data: 'Hello world' };
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.LIST_ROOM)
  async getRooms(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() dto: SearchRoomsDto,
  ) {
    const rooms = await this.roomsService.getRooms(dto, client.user);

    this.sendToCaller(client, {
      dto,
      event: SOCKET_ROOM_EVENTS.LIST_ROOM,
      data: { rooms },
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.READ_ROOM)
  async getRoom(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() dto: SearchRoomDto,
  ) {
    const room = await this.roomsService.getRoomById(dto, client.user);
    if (!room) {
      throw new AppError.NotFound();
    }

    this.sendToCaller(client, {
      dto,
      event: SOCKET_ROOM_EVENTS.READ_ROOM,
      data: room,
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.LIST_MESSAGE)
  async getMessages(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() dto: SearchMessagesDto,
  ) {
    const messages = await this.roomsService.getMessagesByRoomId(
      dto,
      client.user,
    );

    this.sendToCaller(client, {
      dto,
      event: SOCKET_ROOM_EVENTS.LIST_MESSAGE,
      data: { messages },
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.CREATE_ROOM)
  async createRoom(
    @MessageBody() dto: CreateRoomDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = await this.roomsService.createRoom(dto, client.user);

    this.sendToUsers(client, {
      dto,
      event: SOCKET_ROOM_EVENTS.CREATE_ROOM,
      data: room,
      userIds: this.getRoomMembers(room),
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.UPDATE_ROOM)
  async updateRoom(
    @MessageBody() dto: UpdateRoomDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = await this.roomsService.updateRoom(dto, client.user);

    this.sendToUsers(client, {
      dto,
      event: SOCKET_ROOM_EVENTS.UPDATE_ROOM,
      data: room,
      userIds: this.getRoomMembers(room),
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.DELETE_ROOM)
  async deleteRoom(
    @MessageBody() dto: DeleteRoomDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = await this.roomsService.deleteRoom(dto, client.user);

    this.sendToUsers(client, {
      dto,
      event: SOCKET_ROOM_EVENTS.DELETE_ROOM,
      data: room,
      userIds: this.getRoomMembers(room),
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.CREATE_MEMBER)
  async createMember(
    @MessageBody() dto: CreateMemberDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = await this.roomsService.createMember(dto, client.user);

    this.sendToUsers(client, {
      dto,
      event: SOCKET_ROOM_EVENTS.CREATE_MEMBER,
      data: room,
      userIds: this.getRoomMembers(room),
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.UPDATE_MEMBER)
  async updateMember(
    @MessageBody() dto: UpdateMemberDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = await this.roomsService.updateMember(dto, client.user);

    this.sendToUsers(client, {
      dto,
      event: SOCKET_ROOM_EVENTS.UPDATE_MEMBER,
      data: room,
      userIds: this.getRoomMembers(room),
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.DELETE_MEMBER)
  async deleteMember(
    @MessageBody() dto: DeleteMemberDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = await this.roomsService.deleteMember(dto, client.user);

    this.sendToUsers(client, {
      dto,
      event: SOCKET_ROOM_EVENTS.DELETE_MEMBER,
      data: room,
      userIds: this.getRoomMembers(room),
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.CREATE_MESSAGE)
  async createMessage(
    @MessageBody() dto: CreateMessageDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    if (_.size(dto.content)) {
      const message = await this.roomsService.createMessage(
        { roomId: dto.roomId, content: dto.content },
        client.user,
      );

      this.sendToUsers(client, {
        dto,
        event: SOCKET_ROOM_EVENTS.CREATE_MESSAGE,
        userIds: _.map(message.room.roomMembers, 'memberId'),
        data: message,
        unconnectedCallback: async (unconnected) =>
          console.log(`Send notification to ${unconnected.join(',')}`),
      });
    }

    if (!_.size(dto.files)) {
      return;
    }

    const {
      [RoomMessageType.Images]: imageFiles,
      [RoomMessageType.Files]: officeFiles,
    } = await this.roomsService.partitionFiles(dto.files);

    await _.reduce(
      [
        {
          files: imageFiles,
          type:
            _.size(imageFiles) === 1
              ? RoomMessageType.Image
              : RoomMessageType.Images,
        },
        {
          files: officeFiles,
          type: RoomMessageType.Files,
        },
      ] as Array<{ files: Array<IFile>; type: RoomMessageType }>,
      async (promise, { files, type }) => {
        const hasSendUnconnectedCallback = await promise;
        if (!files.length) {
          return hasSendUnconnectedCallback;
        }

        const message = await this.roomsService.createMessageFiles(
          {
            roomId: dto.roomId,
            type,
            files,
          },
          client.user,
        );

        this.sendToUsers(client, {
          dto,
          event: SOCKET_ROOM_EVENTS.CREATE_MESSAGE,
          userIds: _.map(message.room.roomMembers, 'memberId'),
          data: message,
          unconnectedCallback: async (unconnected) => {
            if (hasSendUnconnectedCallback) {
              return;
            }

            console.log(`Send notification to ${unconnected.join(',')}`);
          },
        });

        return true;
      },
      Promise.resolve(!!_.size(dto.content)),
    );
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.UPDATE_MESSAGE)
  async updateMessage(
    @MessageBody() dto: UpdateMessageDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const message = await this.roomsService.updateMessage(dto, client.user);

    this.sendToUsers(client, {
      dto,
      event: SOCKET_ROOM_EVENTS.UPDATE_MESSAGE,
      userIds: _.map(message.room.roomMembers, 'memberId'),
      data: message,
      unconnectedCallback: async (unconnected) =>
        console.log(`Send notification to ${unconnected.join(',')}`),
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.DELETE_MESSAGE)
  async deleteMessage(
    @MessageBody() dto: DeleteMessageDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const message = await this.roomsService.deleteMessage(dto, client.user);

    this.sendToUsers(client, {
      dto,
      event: SOCKET_ROOM_EVENTS.DELETE_MESSAGE,
      userIds: _.map(message.room.roomMembers, 'memberId'),
      data: message,
      unconnectedCallback: async (unconnected) =>
        console.log(`Send notification to ${unconnected.join(',')}`),
    });
  }
}
