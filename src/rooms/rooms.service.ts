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
  SearchMembersDto,
  SearchMessageDto,
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

  private roomMessageSelect = Prisma.validator<Prisma.RoomMessageSelect>()({
    id: true,
    type: true,
    content: true,
    room: {
      select: {
        id: true,
        roomMembers: {
          select: { memberId: true },
          where: { role: { not: RoomMemberRole.None } },
        },
      },
    },
    user: {
      select: {
        username: true,
      },
    },
    createdAt: true,
  });

  private isRoomMember(
    roomMembers: Awaited<
      ReturnType<RoomsService['getRoomById']>
    >['roomMembers'],
    userId: string,
    ...roles: RoomMemberRole[]
  ) {
    return _.some(
      roomMembers,
      (m) =>
        m.member.id === userId &&
        (!roles.length || (roles.length && _.includes(roles, m.role))),
    );
  }

  async getRoomById(query: SearchRoomDto, user?: IdentityUser) {
    return this.prisma.room.findFirst({
      select: this.roomSelect,
      where: {
        id: query.id,
        roomMembers: { some: { memberId: user.id } },
      },
    });
  }

  private async getMembersByRoomId(query: SearchMembersDto) {
    return this.prisma.roomMember.findMany({
      select: this.roomMemberSelect,
      where: { roomId: query.roomId, role: { not: RoomMemberRole.None } },
    });
  }

  private async getMessageById(query: SearchMessageDto) {
    return this.prisma.roomMessage.findFirst({
      select: this.roomMessageSelect,
      where: { id: query.id, type: { not: RoomMemberRole.None } },
    });
  }

  async getRooms(query: SearchRoomsDto, user: IdentityUser) {
    return this.prisma.room.findMany({
      select: this.roomSelect,
      orderBy: { createdAt: 'desc' },
      where: {
        roomMembers: {
          some: { memberId: user.id },
        },
      },
      ...this.makePaginationCursor(query),
    });
  }

  async getMessagesByRoomId(query: SearchMessagesDto, user: IdentityUser) {
    return this.prisma.roomMessage.findMany({
      select: {
        id: true,
        type: true,
        content: true,
        room: {
          select: {
            id: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
        createdAt: true,
      },
      where: {
        room: {
          id: query.roomId,
          roomMembers: { some: { memberId: user.id } },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...this.makePaginationCursor(query),
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
          room.roomMembers,
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

      if (!this.isRoomMember(room.roomMembers, user.id, RoomMemberRole.Admin)) {
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
          room.roomMembers,
          user.id,
          RoomMemberRole.Admin,
          RoomMemberRole.Moderator,
        )
      ) {
        throw new AppError.AccessDenied();
      }

      if (!this.isRoomMember(room.roomMembers, dto.id)) {
        await tx.roomMember.create({
          data: { roomId: dto.roomId, memberId: dto.id, role: dto.role },
        });
        return this.getRoomById({ id: dto.roomId });
      }

      if (this.isRoomMember(room.roomMembers, dto.id, RoomMemberRole.None)) {
        await tx.roomMember.update({
          data: { role: dto.role },
          where: {
            roomId_memberId: { roomId: dto.roomId, memberId: dto.id },
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
          room.roomMembers,
          user.id,
          RoomMemberRole.Admin,
          RoomMemberRole.Moderator,
        ) ||
        this.isRoomMember(room.roomMembers, dto.id, RoomMemberRole.None) ||
        (dto.role === RoomMemberRole.Admin &&
          !this.isRoomMember(room.roomMembers, user.id, RoomMemberRole.Admin))
      ) {
        throw new AppError.AccessDenied();
      }

      await tx.roomMember.update({
        data: {
          nickName: dto.nickName,
          role: dto.role,
        },
        where: {
          roomId_memberId: { roomId: dto.roomId, memberId: dto.id },
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
          room.roomMembers,
          user.id,
          RoomMemberRole.Admin,
          RoomMemberRole.Moderator,
          RoomMemberRole.Member,
        ) ||
        (dto.id !== user.id &&
          this.isRoomMember(
            room.roomMembers,
            user.id,
            RoomMemberRole.Member,
          )) ||
        (this.isRoomMember(room.roomMembers, dto.id, RoomMemberRole.Admin) &&
          !this.isRoomMember(room.roomMembers, user.id, RoomMemberRole.Admin))
      ) {
        throw new AppError.AccessDenied();
      }

      await tx.roomMember.update({
        data: {
          role: RoomMemberRole.None,
        },
        where: {
          roomId_memberId: { roomId: dto.roomId, memberId: dto.id },
        },
      });

      return this.getRoomById({ id: dto.roomId });
    });
  }

  async createMessage(dto: CreateMessageDto, user: IdentityUser) {
    return this.prisma.$transaction(async (tx) => {
      const members = await this.getMembersByRoomId({ roomId: dto.roomId });
      if (
        !this.isRoomMember(
          members,
          user.id,
          RoomMemberRole.Admin,
          RoomMemberRole.Moderator,
          RoomMemberRole.Member,
        )
      ) {
        throw new AppError.AccessDenied();
      }

      return tx.roomMessage.create({
        select: this.roomMessageSelect,
        data: {
          roomId: dto.roomId,
          userId: user.id,
          type: dto.type,
          content: dto.content,
        },
      });
    });
  }

  async updateMessage(dto: UpdateMessageDto, user: IdentityUser) {
    return this.prisma.$transaction(async (tx) => {
      const message = await this.getMessageById({ id: dto.id });
      if (
        !message ||
        !this.isRoomMember(
          await this.getMembersByRoomId({ roomId: message.room.id }),
          user.id,
          RoomMemberRole.Admin,
          RoomMemberRole.Moderator,
          RoomMemberRole.Member,
        )
      ) {
        throw new AppError.AccessDenied();
      }

      return tx.roomMessage.findFirst({
        select: this.roomMessageSelect,
        where: { id: dto.id },
      });
    });
  }

  async deleteMessage(dto: DeleteMessageDto, user: IdentityUser) {
    return this.prisma.$transaction(async (tx) => {
      const message = await this.getMessageById({ id: dto.id });
      if (
        !message ||
        message.type === RoomMessageType.None ||
        !this.isRoomMember(
          await this.getMembersByRoomId({ roomId: message.room.id }),
          user.id,
          RoomMemberRole.Admin,
          RoomMemberRole.Moderator,
          RoomMemberRole.Member,
        )
      ) {
        throw new AppError.AccessDenied();
      }

      return tx.roomMessage.update({
        select: this.roomMessageSelect,
        data: { content: Prisma.JsonNull, type: RoomMessageType.None },
        where: { id: dto.id },
      });
    });
  }
}
