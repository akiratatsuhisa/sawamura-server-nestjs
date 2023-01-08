import { Injectable } from '@nestjs/common';
import { Prisma, RoomMessageType } from '@prisma/client';
import * as _ from 'lodash';
import { IdentityUser } from 'src/auth/identity.class';
import { PaginationService } from 'src/common/services';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  CreateMemberDto,
  CreateMessageDto,
  CreateRoomDto,
  DeleteMemberDto,
  DeleteMessageDto,
  DeleteRoomDto,
  SearchMembersDto,
  SearchMessagesDto,
  SearchRoomDto,
  SearchRoomsDto,
  UpdateMemberDto,
  UpdateMessageDto,
  UpdateRoomDto,
} from './dtos';

@Injectable()
export class RoomsService extends PaginationService {
  constructor(private prisma: PrismaService) {
    super();
  }

  private roomMemberSelect: Prisma.RoomMemberSelect = {
    id: true,
    nickName: true,
    role: true,
    member: {
      select: {
        id: true,
        username: true,
      },
    },
    createdAt: true,
  };

  private roomSelect: Prisma.RoomSelect = {
    id: true,
    name: true,
    isGroup: true,
    roomMembers: {
      select: this.roomMemberSelect,
      where: {
        deletedAt: null,
      },
    },
    createdAt: true,
  };

  async getRooms(query: SearchRoomsDto) {
    return this.prisma.room.findMany({
      select: this.roomSelect,
      where: {
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      ...this.makePaginationCursor(query),
    });
  }

  async getRoomById(query: SearchRoomDto) {
    return this.prisma.room.findFirst({
      select: this.roomSelect,
      where: { id: query.id, deletedAt: null },
    });
  }

  async getMembersByRoomId(query: SearchMembersDto) {
    return this.prisma.roomMember.findMany({
      select: this.roomMemberSelect,
      where: { roomId: query.roomId, deletedAt: null },
    });
  }

  async getMessagesByRoomId(query: SearchMessagesDto) {
    const messages = await this.prisma.roomMessage.findMany({
      where: { roomId: query.roomId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      ...this.makePaginationCursor(query),
    });

    return _.forEach(messages, (message) => {
      switch (message.type) {
        case RoomMessageType.None:
          message.content = null;
          break;
      }
    });
  }

  async createRoom(dto: CreateRoomDto, user: IdentityUser) {
    //
  }

  async updateRoom(dto: UpdateRoomDto, user: IdentityUser) {
    //
  }

  async deleteRoom(dto: DeleteRoomDto, user: IdentityUser) {
    //
  }

  async createMember(dto: CreateMemberDto, user: IdentityUser) {
    //
  }

  async updateMember(dto: UpdateMemberDto, user: IdentityUser) {
    //
  }

  async deleteMember(dto: DeleteMemberDto, user: IdentityUser) {
    //
  }

  async createMessage(dto: CreateMessageDto, user: IdentityUser) {
    //
  }

  async updateMessage(dto: UpdateMessageDto, user: IdentityUser) {
    //
  }

  async deleteMessage(dto: DeleteMessageDto, user: IdentityUser) {
    //
  }
}
