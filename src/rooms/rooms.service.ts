import { Injectable } from '@nestjs/common';
import { Prisma, RoomMemberRole, RoomMessageType } from '@prisma/client';
import * as _ from 'lodash';
import * as path from 'path';
import { IdentityUser } from 'src/auth/identity.class';
import { AppError } from 'src/common/errors';
import { PaginationService } from 'src/common/services';
import { MESSAGE_FILE } from 'src/constants';
import { DropboxService } from 'src/dropbox/dropbox.service';
import {
  getMimeTypeFromExtension,
  IFile,
  importFileType,
} from 'src/helpers/file-type.helper';
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
  SearchMessageFileDto,
  SearchMessagesDto,
  SearchRoomDto,
  SearchRoomPhotoDto,
  SearchRoomsDto,
  UpdateMemberDto,
  UpdateMessageDto,
  UpdateRoomDto,
} from './dtos';
import { CreateFileMessageDto } from './dtos/message/create.dto';
import {
  roomMemberSelect,
  roomMessageSelect,
  roomSelect,
} from './rooms.factory';

@Injectable()
export class RoomsService extends PaginationService {
  constructor(
    private prisma: PrismaService,
    private dropboxService: DropboxService,
  ) {
    super();
  }

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
      select: roomSelect,
      where: {
        id: query.id,
        roomMembers: user
          ? { some: { memberId: user.id, role: { not: RoomMemberRole.None } } }
          : undefined,
      },
    });
  }

  private async getMembersByRoomId(query: SearchMembersDto) {
    return this.prisma.roomMember.findMany({
      select: roomMemberSelect,
      where: { roomId: query.roomId, role: { not: RoomMemberRole.None } },
    });
  }

  private async getMessageById(query: SearchMessageDto) {
    return this.prisma.roomMessage.findFirst({
      select: roomMessageSelect,
      where: { id: query.id, type: { not: RoomMemberRole.None } },
    });
  }

  async getRooms(query: SearchRoomsDto, user: IdentityUser) {
    return this.prisma.room.findMany({
      select: roomSelect,
      orderBy: { lastActivatedAt: { sort: 'desc', nulls: 'last' } },
      where: {
        roomMembers: {
          some: { memberId: user.id, role: { not: RoomMemberRole.None } },
        },
        id: query.excludeIds?.length ? { notIn: query.excludeIds } : undefined,
      },
      take: query.take,
    });
  }

  async getMessagesByRoomId(query: SearchMessagesDto, user: IdentityUser) {
    return this.prisma.roomMessage.findMany({
      select: roomMessageSelect,
      where: {
        room: {
          id: query.roomId,
          roomMembers: {
            some: { memberId: user.id, role: { not: RoomMemberRole.None } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...this.makePaginationCursor(query),
    });
  }

  async createRoom(dto: CreateRoomDto, user: IdentityUser) {
    if (!_.some(dto.members, (member) => member.memberId === user.id)) {
      throw new AppError.Argument(
        AppError.Messages.NotRoomMember(user.username),
      );
    }

    if (
      dto.isGroup &&
      (!_.some(dto.members, (member) => member.role === RoomMemberRole.Admin) ||
        _.size(dto.members) < 2)
    ) {
      throw new AppError.Argument(AppError.Messages.InvalidGroupRoom);
    }

    if (
      !dto.isGroup &&
      (_.size(dto.members) != 2 ||
        _.every(
          dto.members,
          (member) => member.role !== RoomMemberRole.Moderator,
        ))
    ) {
      throw new AppError.Argument(AppError.Messages.InvalidPrivateRoom);
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
          throw new AppError.Argument(AppError.Messages.InvalidPrivateRoom);
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
        select: roomSelect,
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
        select: roomSelect,
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
        select: roomSelect,
        where: { id: dto.id },
      });
    });
  }

  async getRoomPhoto(dto: SearchRoomPhotoDto) {
    const room = await this.getRoomById({ id: dto.id });
    if (!room) {
      throw new AppError.NotFound();
    }

    const { buffer } = await this.dropboxService.fileDownload(
      room.photoUrl?.substring(1),
    );

    const mimeType = 'image/' + path.extname(room.photoUrl)?.substring(1);

    return { mimeType, buffer };
  }

  async updateRoomPhoto(
    image: IFile,
    dto: SearchRoomPhotoDto,
    user: IdentityUser,
  ) {
    const room = await this.getRoomById({ id: dto.id });
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

    const result = await this.dropboxService.fileUpload(image, {
      path: room.id,
      mode: { '.tag': 'overwrite' },
    });

    return this.prisma.room.update({
      data: {
        photoUrl: result.pathDisplay,
      },
      where: {
        id: dto.id,
      },
      select: roomSelect,
    });
  }

  async createMember(dto: CreateMemberDto, user: IdentityUser) {
    await this.prisma.$transaction(async (tx) => {
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

      if (!this.isRoomMember(room.roomMembers, dto.memberId)) {
        await tx.roomMember.create({
          data: { roomId: dto.roomId, memberId: dto.memberId, role: dto.role },
        });
        return;
      }

      if (
        this.isRoomMember(room.roomMembers, dto.memberId, RoomMemberRole.None)
      ) {
        await tx.roomMember.update({
          data: { role: dto.role },
          where: {
            roomId_memberId: { roomId: dto.roomId, memberId: dto.memberId },
          },
        });
        return;
      }

      throw new AppError.AccessDenied();
    });

    return this.getRoomById({ id: dto.roomId });
  }

  async updateMember(dto: UpdateMemberDto, user: IdentityUser) {
    await this.prisma.$transaction(async (tx) => {
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
        this.isRoomMember(
          room.roomMembers,
          dto.memberId,
          RoomMemberRole.None,
        ) ||
        ((this.isRoomMember(
          room.roomMembers,
          dto.memberId,
          RoomMemberRole.Admin,
        ) ||
          dto.role === RoomMemberRole.Admin) &&
          this.isRoomMember(
            room.roomMembers,
            user.id,
            RoomMemberRole.Moderator,
            RoomMemberRole.Member,
            RoomMemberRole.None,
          ))
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
    });

    return this.getRoomById({ id: dto.roomId });
  }

  async deleteMember(dto: DeleteMemberDto, user: IdentityUser) {
    await this.prisma.$transaction(async (tx) => {
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
        (dto.memberId !== user.id &&
          this.isRoomMember(
            room.roomMembers,
            user.id,
            RoomMemberRole.Member,
          )) ||
        (this.isRoomMember(
          room.roomMembers,
          dto.memberId,
          RoomMemberRole.Admin,
        ) &&
          this.isRoomMember(
            room.roomMembers,
            user.id,
            RoomMemberRole.Moderator,
            RoomMemberRole.Member,
            RoomMemberRole.None,
          ))
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
    });

    return this.getRoomById({ id: dto.roomId });
  }

  private getMessageType(content: string): RoomMessageType {
    if (
      /^[\p{Extended_Pictographic}][\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]*$/u.test(
        content,
      )
    ) {
      return RoomMessageType.Icon;
    }

    if (
      /^[\p{Extended_Pictographic}][\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]*(\s*[\p{Extended_Pictographic}][\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]*)+$/u.test(
        content,
      )
    ) {
      return RoomMessageType.Icons;
    }

    return RoomMessageType.Text;
  }

  async createMessage(
    dto: Omit<CreateMessageDto, 'content' | 'files'> & { content: string },
    user: IdentityUser,
  ) {
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

      const roomMessage = await tx.roomMessage.create({
        select: roomMessageSelect,
        data: {
          roomId: dto.roomId,
          userId: user.id,
          type: this.getMessageType(dto.content),
          content: dto.content,
        },
      });

      await tx.room.update({
        data: { lastActivatedAt: roomMessage.createdAt },
        where: { id: dto.roomId },
      });

      return roomMessage;
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
        select: roomMessageSelect,
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
        select: roomMessageSelect,
        data: { content: Prisma.JsonNull, type: RoomMessageType.None },
        where: { id: dto.id },
      });
    });
  }

  async createMessageFiles(
    dto: Omit<CreateMessageDto, 'content' | 'files'> & {
      type: RoomMessageType;
      files: Array<IFile>;
    },
    user: IdentityUser,
  ) {
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

      const result = await this.dropboxService.filesUpload(
        dto.files,
        {
          path: dto.roomId,
        },
        { throwOnFail: false },
      );

      const roomMessage = await tx.roomMessage.create({
        select: roomMessageSelect,
        data: {
          roomId: dto.roomId,
          userId: user.id,
          type: dto.type,
          content: result,
        },
      });

      await tx.room.update({
        data: { lastActivatedAt: roomMessage.createdAt },
        where: { id: dto.roomId },
      });

      return roomMessage;
    });
  }

  async getFile(dto: SearchMessageFileDto, user: IdentityUser) {
    const room = await this.getRoomById({ id: dto.roomId });

    if (!room) {
      throw new AppError.NotFound();
    }

    if (
      !room.isGroup ||
      this.isRoomMember(room.roomMembers, user.id, RoomMemberRole.None)
    ) {
      throw new AppError.AccessDenied();
    }

    const { buffer } = await this.dropboxService.fileDownload(
      dto.name,
      dto.roomId,
    );

    return { buffer };
  }

  async partitionFiles(files: Array<CreateFileMessageDto>) {
    const { fileTypeFromBuffer } = await importFileType();

    const filesWithDetail = await Promise.all(
      files.map(async ({ data, name }) => {
        const { ext: extension, mime } =
          (await fileTypeFromBuffer(data)) ?? getMimeTypeFromExtension(name);

        return {
          name,
          buffer: data,
          type: (MESSAGE_FILE.IMAGE_MIME_TYPES.test(mime)
            ? RoomMessageType.Images
            : MESSAGE_FILE.OFFICE_MIME_TYPES.test(mime)
            ? RoomMessageType.Files
            : RoomMessageType.None) as RoomMessageType,
          extension,
          mime,
        } as IFile;
      }),
    );

    return _.groupBy(filesWithDetail, 'type');
  }

  private roomMessageFileTypes = [
    RoomMessageType.Files,
    RoomMessageType.Images,
    RoomMessageType.Image,
    RoomMessageType.Audios,
    RoomMessageType.Medias,
    RoomMessageType,
  ];

  isRoomMessageFileTypes(type: RoomMessageType) {
    return _.some(this.roomMessageFileTypes, (t) => t === type);
  }
}
