import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { RoomMemberRole, RoomMessageType } from '@prisma/client';
import * as _ from 'lodash';
import { AppError } from 'src/common/errors';
import { IFile } from 'src/helpers/file-type.interface';
import { NotificationsService } from 'src/notifications/notifications.service';
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
    private notificationsService: NotificationsService,
  ) {
    super(configService, wsAuthService);
  }

  mapSendToRoomMembers(room: Awaited<ReturnType<RoomsService['getRoomById']>>) {
    return _(room.roomMembers)
      .filter((m) => m.role !== RoomMemberRole.None)
      .map((m) => m.member.id)
      .value();
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.LIST_ROOM)
  async getRooms(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() dto: SearchRoomsDto,
  ) {
    const rooms = await this.roomsService.getRooms(dto, client.user);

    this.sendToCaller({
      socket: client,
      event: SOCKET_ROOM_EVENTS.LIST_ROOM,
      dto,
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

    this.sendToCaller({
      socket: client,
      event: SOCKET_ROOM_EVENTS.READ_ROOM,
      dto,
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

    this.sendToCaller({
      socket: client,
      event: SOCKET_ROOM_EVENTS.LIST_MESSAGE,
      dto,
      data: { messages },
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.CREATE_ROOM)
  async createRoom(
    @MessageBody() dto: CreateRoomDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = await this.roomsService.createRoom(dto, client.user);

    this.sendToUsers({
      socket: client,
      event: SOCKET_ROOM_EVENTS.CREATE_ROOM,
      dto,
      data: room,
      userIds: this.mapSendToRoomMembers(room),
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.UPDATE_ROOM)
  async updateRoom(
    @MessageBody() dto: UpdateRoomDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = await this.roomsService.updateRoom(dto, client.user);

    this.sendToUsers({
      socket: client,
      event: SOCKET_ROOM_EVENTS.UPDATE_ROOM,
      dto,
      data: room,
      userIds: this.mapSendToRoomMembers(room),
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.DELETE_ROOM)
  async deleteRoom(
    @MessageBody() dto: DeleteRoomDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = await this.roomsService.deleteRoom(dto, client.user);

    this.sendToUsers({
      socket: client,
      event: SOCKET_ROOM_EVENTS.DELETE_ROOM,
      dto,
      data: room,
      userIds: this.mapSendToRoomMembers(room),
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.CREATE_MEMBER)
  async createMember(
    @MessageBody() dto: CreateMemberDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = await this.roomsService.createMember(dto, client.user);

    this.sendToUsers({
      socket: client,
      event: SOCKET_ROOM_EVENTS.CREATE_MEMBER,
      dto,
      data: room,
      userIds: this.mapSendToRoomMembers(room),
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.UPDATE_MEMBER)
  async updateMember(
    @MessageBody() dto: UpdateMemberDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = await this.roomsService.updateMember(dto, client.user);

    this.sendToUsers({
      socket: client,
      event: SOCKET_ROOM_EVENTS.UPDATE_MEMBER,
      dto,
      data: room,
      userIds: this.mapSendToRoomMembers(room),
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.DELETE_MEMBER)
  async deleteMember(
    @MessageBody() dto: DeleteMemberDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = await this.roomsService.deleteMember(dto, client.user);

    this.sendToUsers({
      socket: client,
      event: SOCKET_ROOM_EVENTS.DELETE_MEMBER,
      dto,
      data: room,
      userIds: this.mapSendToRoomMembers(room),
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

      const socketUsers = this.sendToUsers({
        socket: client,
        event: SOCKET_ROOM_EVENTS.CREATE_MESSAGE,
        dto,
        data: message,
        userIds: this.mapSendToRoomMembers(message.room),
      });

      this.notificationsService.prepareMessageNotifications(
        message,
        socketUsers,
        client.user,
      );
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
        await promise;

        const message = await this.roomsService.createMessageFiles(
          {
            roomId: dto.roomId,
            type,
            files,
          },
          client.user,
        );

        const socketUsers = this.sendToUsers({
          socket: client,
          event: SOCKET_ROOM_EVENTS.CREATE_MESSAGE,
          dto,
          data: message,
          userIds: this.mapSendToRoomMembers(message.room),
        });

        this.notificationsService.prepareMessageNotifications(
          message,
          socketUsers,
          client.user,
        );

        return;
      },
      Promise.resolve(),
    );
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.UPDATE_MESSAGE)
  async updateMessage(
    @MessageBody() dto: UpdateMessageDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const message = await this.roomsService.updateMessage(dto, client.user);

    this.sendToUsers({
      socket: client,
      event: SOCKET_ROOM_EVENTS.UPDATE_MESSAGE,
      dto,
      data: message,
      userIds: this.mapSendToRoomMembers(message.room),
    });
  }

  @SubscribeMessage(SOCKET_ROOM_EVENTS.DELETE_MESSAGE)
  async deleteMessage(
    @MessageBody() dto: DeleteMessageDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const message = await this.roomsService.deleteMessage(dto, client.user);

    this.sendToUsers({
      socket: client,
      event: SOCKET_ROOM_EVENTS.DELETE_MESSAGE,
      dto,
      data: message,
      userIds: this.mapSendToRoomMembers(message.room),
    });
  }
}
