import { Injectable } from '@nestjs/common';
import { Prisma, RoomMemberRole, RoomMessageType } from '@prisma/client';
import * as _ from 'lodash';
import { IdentityUser } from 'src/auth/identity.class';
import { AppError, messages } from 'src/common/errors';
import { PaginationService } from 'src/common/services';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  CreateMemberDto,
  CreateMessageDto,
  CreateRoomDto,
  DeleteMemberDto,
  DeleteMessageDto,
  DeleteRoomDto,
  SearchMemberDto,
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

  private roomMemberSelect = Prisma.validator<Prisma.RoomMemberSelect>()({
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
  });

  private roomSelect = Prisma.validator<Prisma.RoomSelect>()({
    id: true,
    name: true,
    isGroup: true,
    roomMembers: {
      select: this.roomMemberSelect,
    },
    createdAt: true,
  });

  private isRoomMember(
    room: Awaited<ReturnType<RoomsService['getRoomById']>>,
    userId: string,
    ...roles: RoomMemberRole[]
  ) {
    return _.some(
      room.roomMembers,
      (m) =>
        m.member.id === userId &&
        (!roles.length || (roles.length && _.includes(roles, m.role))),
    );
  }

  async getRooms(query: SearchRoomsDto) {
    return this.prisma.room.findMany({
      select: this.roomSelect,
      orderBy: { createdAt: 'desc' },
      ...this.makePaginationCursor(query),
    });
  }

  async getRoomById(query: SearchRoomDto) {
    return this.prisma.room.findFirst({
      select: this.roomSelect,
      where: { id: query.id },
    });
  }

  private async getMemberByRoomId(query: SearchMemberDto) {
    return this.prisma.roomMember.findFirst({
      select: this.roomSelect,
      where: {
        roomId: query.roomId,
        memberId: query.memberId,
        role: { not: RoomMemberRole.None },
      },
    });
  }

  async getMembersByRoomId(query: SearchMembersDto) {
    return this.prisma.roomMember.findMany({
      select: this.roomSelect,
      where: { roomId: query.roomId, role: { not: RoomMemberRole.None } },
    });
  }

  async getMessagesByRoomId(query: SearchMessagesDto) {
    const messages = await this.prisma.roomMessage.findMany({
      where: { roomId: query.roomId },
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
    if (!_.some(dto.members, (member) => member.memberId === user.id)) {
      throw new AppError.Argument(messages.NotRoomMember(user.username));
    }

    if (
      dto.isGroup &&
      (!_.some(dto.members, (member) => member.role === RoomMemberRole.Admin) ||
        _.size(dto.members) != 2)
    ) {
      throw new AppError.Argument(messages.InvalidGroupRoom);
    }

    if (
      !dto.isGroup &&
      (_.size(dto.members) != 2 ||
        _.every(
          dto.members,
          (member) => member.role !== RoomMemberRole.Moderator,
        ))
    ) {
      throw new AppError.Argument(messages.InvalidPrivateRoom);
    }

    return this.prisma.$transaction(async (tx) => {
      if (!dto.isGroup) {
        const privateRoom = await tx.room.findFirst({
          select: { id: true },
          where: {
            isGroup: dto.isGroup,
            roomMembers: {
              every: {
                memberId: { in: _.map(dto.members, 'memberId') },
              },
            },
          },
        });

        if (privateRoom) {
          throw new AppError.Argument(messages.InvalidPrivateRoom);
        }
      }

      return tx.room.create({
        data: {
          name: dto.name,
          isGroup: dto.isGroup,
          roomMembers: {
            create: dto.members,
          },
        },
        select: this.roomSelect,
      });
    });
  }

  async updateRoom(dto: UpdateRoomDto, user: IdentityUser) {
    return this.prisma.$transaction(async (tx) => {
      const room = await this.getRoomById({ id: dto.id });
      if (!room) {
        throw new AppError.NotFound();
      }

      if (
        !this.isRoomMember(
          room,
          user.id,
          RoomMemberRole.Admin,
          RoomMemberRole.Moderator,
        )
      ) {
        throw new AppError.AccessDenied();
      }

      return tx.room.update({
        select: this.roomSelect,
        data: {
          name: dto.name,
        },
        where: { id: dto.id },
      });
    });
  }

  async deleteRoom(dto: DeleteRoomDto, user: IdentityUser) {
    return this.prisma.$transaction(async (tx) => {
      const room = await this.getRoomById({ id: dto.id });
      if (!room || !room.isGroup) {
        throw new AppError.NotFound();
      }

      if (!this.isRoomMember(room, user.id, RoomMemberRole.Admin)) {
        throw new AppError.AccessDenied();
      }

      return tx.room.delete({
        select: this.roomSelect,
        where: { id: dto.id },
      });
    });
  }

  async createMember(dto: CreateMemberDto, user: IdentityUser) {
    return this.prisma.$transaction(async (tx) => {
      const room = await this.getRoomById({ id: dto.roomId });

      if (!room) {
        throw new AppError.NotFound();
      }

      if (
        !room.isGroup ||
        !this.isRoomMember(
          room,
          user.id,
          RoomMemberRole.Admin,
          RoomMemberRole.Moderator,
        )
      ) {
        throw new AppError.AccessDenied();
      }

      if (!this.isRoomMember(room, dto.memberId)) {
        await tx.roomMember.create({
          data: { roomId: dto.roomId, memberId: dto.memberId, role: dto.role },
        });
        return this.getRoomById({ id: dto.roomId });
      }

      if (this.isRoomMember(room, dto.memberId, RoomMemberRole.None)) {
        await tx.roomMember.update({
          data: { role: dto.role },
          where: {
            roomId_memberId: { roomId: dto.roomId, memberId: dto.memberId },
          },
        });
        return this.getRoomById({ id: dto.roomId });
      }

      throw new AppError.AccessDenied();
    });
  }

  async updateMember(dto: UpdateMemberDto, user: IdentityUser) {
    return this.prisma.$transaction(async (tx) => {
      const room = await this.getRoomById({ id: dto.roomId });

      if (!room) {
        throw new AppError.NotFound();
      }

      if (
        (!room.isGroup && dto.role) ||
        !this.isRoomMember(
          room,
          user.id,
          RoomMemberRole.Admin,
          RoomMemberRole.Moderator,
        ) ||
        this.isRoomMember(room, dto.memberId, RoomMemberRole.None) ||
        (dto.role === RoomMemberRole.Admin &&
          !this.isRoomMember(room, user.id, RoomMemberRole.Admin))
      ) {
        throw new AppError.AccessDenied();
      }

      await tx.roomMember.update({
        data: {
          nickName: dto.nickName,
          role: dto.role,
        },
        where: {
          roomId_memberId: { roomId: dto.roomId, memberId: dto.memberId },
        },
      });

      return this.getRoomById({ id: dto.roomId });
    });
  }

  async deleteMember(dto: DeleteMemberDto, user: IdentityUser) {
    return this.prisma.$transaction(async (tx) => {
      const room = await this.getRoomById({ id: dto.roomId });

      if (!room) {
        throw new AppError.NotFound();
      }

      if (
        !room.isGroup ||
        !this.isRoomMember(
          room,
          user.id,
          RoomMemberRole.Admin,
          RoomMemberRole.Moderator,
          RoomMemberRole.Member,
        ) ||
        (dto.memberId !== user.id &&
          this.isRoomMember(room, user.id, RoomMemberRole.Member)) ||
        (this.isRoomMember(room, dto.memberId, RoomMemberRole.Admin) &&
          !this.isRoomMember(room, user.id, RoomMemberRole.Admin))
      ) {
        throw new AppError.AccessDenied();
      }

      await tx.roomMember.update({
        data: {
          role: RoomMemberRole.None,
        },
        where: {
          roomId_memberId: { roomId: dto.roomId, memberId: dto.memberId },
        },
      });

      return this.getRoomById({ id: dto.roomId });
    });
  }

  async createMessage(dto: CreateMessageDto, user: IdentityUser) {
    return this.prisma.$transaction(async (tx) => {
      //
    });
  }

  async updateMessage(dto: UpdateMessageDto, user: IdentityUser) {
    return this.prisma.$transaction(async (tx) => {
      //
    });
  }

  async deleteMessage(dto: DeleteMessageDto, user: IdentityUser) {
    return this.prisma.$transaction(async (tx) => {
      //
    });
  }
}
