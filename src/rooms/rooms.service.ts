import {
  messages as commonMessages,
  Regex,
} from '@akiratatsuhisa/sawamura-utils';
import { InjectQueue } from '@nestjs/bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma, RoomMemberRole, RoomMessageType } from '@prisma/client';
import { Queue } from 'bull';
import { Cache } from 'cache-manager';
import _ from 'lodash';
import { IdentityUser } from 'src/auth/decorators';
import { AppError } from 'src/common/errors';
import { PaginationService } from 'src/common/services';
import { MessageFile } from 'src/constants';
import { DropboxService } from 'src/dropbox/dropbox.service';
import { FileType, IFile } from 'src/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

import { NAME, QUEUE_ROOM_EVENTS } from './constants';
import {
  CreateFileMessageDto,
  CreateMemberDto,
  CreateMessageDto,
  CreateRoomDto,
  DeleteMemberDto,
  DeleteMessageDto,
  DeleteRoomDto,
  DeleteRoomImageDto,
  SearchAdvancedRoomsDto,
  SearchImageDto,
  SearchMembersDto,
  SearchMessageDto,
  SearchMessageFileDto,
  SearchMessagesDto,
  SearchRoomDto,
  SearchRoomPrivateDto,
  SearchRoomsDto,
  UpdateMemberDto,
  UpdateMessageDto,
  UpdateRoomDto,
  UpdateRoomImageDto,
  UpdateRoomThemeDto,
} from './dtos';
import {
  roomAdvancedSelect,
  roomMemberSelect,
  roomMessageSelect,
  roomSelect,
} from './rooms.factory';

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private dropboxService: DropboxService,
    @InjectQueue(NAME) private roomsQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async searchAdvanced(dto: SearchAdvancedRoomsDto, user: IdentityUser) {
    const matchPrivateTargetMember: Array<Prisma.RoomWhereInput> = [
      { roomMembers: { some: { memberId: user.id } } },
      {
        isGroup: false,
        roomMembers: {
          some: {
            OR: [
              {
                member: {
                  id: { not: user.id },
                  displayName: { contains: dto.search },
                },
              },
              {
                member: {
                  id: { not: user.id },
                },
                nickName: { contains: dto.search },
              },
            ],
          },
        },
      },
    ];

    const matchGroupName: Array<Prisma.RoomWhereInput> = [
      { roomMembers: { some: { memberId: user.id } } },
      { isGroup: true, name: { contains: dto.search } },
    ];

    const [rooms1, rooms2] = await Promise.all([
      this.prisma.room.findMany({
        select: roomAdvancedSelect,
        where: {
          AND: matchPrivateTargetMember,
        },
        take: 5,
        ...(dto.privateRoomId
          ? { cursor: { id: dto.privateRoomId }, skip: 1 }
          : {}),
        orderBy: {
          lastActivatedAt: 'desc',
        },
      }),
      this.prisma.room.findMany({
        select: roomAdvancedSelect,
        where: {
          AND: matchGroupName,
        },
        take: 5,
        ...(dto.groupRoomId
          ? { cursor: { id: dto.groupRoomId }, skip: 1 }
          : {}),
        orderBy: {
          lastActivatedAt: 'desc',
        },
      }),
    ]);

    return _.sortBy([...rooms1, ...rooms2], ['lastActivatedAt'], ['desc']);
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

  async getRoomPrivate(query: SearchRoomPrivateDto, user?: IdentityUser) {
    const room = await this.prisma.room.findFirst({
      select: roomSelect,
      where: {
        isGroup: false,
        AND: [
          {
            roomMembers: { some: { memberId: query.otherUserId } },
          },
          {
            roomMembers: { some: { memberId: user.id } },
          },
        ],
      },
    });
    if (room) {
      return room;
    }
    return this.prisma.room.create({
      data: {
        name: uuidv4(),
        isGroup: false,
        roomMembers: {
          create: [
            {
              memberId: user.id,
              role: RoomMemberRole.Moderator,
            },
            {
              memberId: query.otherUserId,
              role: RoomMemberRole.Moderator,
            },
          ],
        },
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
      ...PaginationService.makePaginationCursor(query),
    });
  }

  async createRoom(dto: CreateRoomDto, user: IdentityUser) {
    if (!_.some(dto.members, (member) => member.memberId === user.id)) {
      throw new AppError.Argument(commonMessages.error.notRoomMember);
    }

    if (
      dto.isGroup &&
      (!_.some(
        dto.members,
        (member) => member.role === RoomMemberRole.Administrator,
      ) ||
        _.size(dto.members) < 2)
    ) {
      throw new AppError.Argument(commonMessages.error.groupRoomDeclare);
    }

    if (
      !dto.isGroup &&
      (_.size(dto.members) != 2 ||
        _.every(
          dto.members,
          (member) => member.role !== RoomMemberRole.Moderator,
        ))
    ) {
      throw new AppError.Argument(commonMessages.error.privateRoomDeclare);
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
          throw new AppError.Argument(commonMessages.error.privateRoomDeclare);
        }
      }

      return tx.room.create({
        data: {
          name: dto.isGroup ? dto.name : uuidv4(),
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
          RoomMemberRole.Administrator,
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

      if (
        !this.isRoomMember(
          room.roomMembers,
          user.id,
          RoomMemberRole.Administrator,
        )
      ) {
        throw new AppError.AccessDenied();
      }

      return tx.room.delete({
        select: roomSelect,
        where: { id: dto.id },
      });
    });
  }

  async getImageLink(dto: SearchImageDto) {
    const fieldName = dto.type === 'photo' ? 'photoUrl' : 'coverUrl';

    const room = await this.getRoomById({ id: dto.id });
    if (!room) {
      throw new AppError.NotFound();
    }

    return this.cacheManager.wrap(
      `room:${dto.id}:${dto.type}`,
      () => this.dropboxService.getTemporaryLink(room[fieldName]),
      MessageFile.CACHE_TIME,
    );
  }

  async updateImage(image: IFile, dto: UpdateRoomImageDto, user: IdentityUser) {
    const fieldName = dto.type === 'photo' ? 'photoUrl' : 'coverUrl';

    const room = await this.getRoomById({ id: dto.id });
    if (!room) {
      throw new AppError.NotFound();
    }

    if (
      (!room.isGroup && dto.type === 'photo') ||
      !this.isRoomMember(
        room.roomMembers,
        user.id,
        RoomMemberRole.Administrator,
        RoomMemberRole.Moderator,
      )
    ) {
      throw new AppError.AccessDenied();
    }

    this.roomsQueue.add(
      QUEUE_ROOM_EVENTS.UPDATE_ROOM_IMAGE,
      { fieldName, room, dto, image },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async deleteImage(dto: DeleteRoomImageDto, user: IdentityUser) {
    const fieldName = dto.type === 'photo' ? 'photoUrl' : 'coverUrl';

    const room = await this.getRoomById({ id: dto.id });
    if (!room) {
      throw new AppError.NotFound();
    }

    if (
      (!room.isGroup && dto.type === 'photo') ||
      !this.isRoomMember(
        room.roomMembers,
        user.id,
        RoomMemberRole.Administrator,
        RoomMemberRole.Moderator,
      )
    ) {
      throw new AppError.AccessDenied();
    }

    this.roomsQueue.add(
      QUEUE_ROOM_EVENTS.DELETE_ROOM_IMAGE,
      { fieldName, room, dto },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async updateTheme(dto: UpdateRoomThemeDto, user: IdentityUser) {
    const room = await this.getRoomById({ id: dto.id });
    if (!room) {
      throw new AppError.NotFound();
    }

    if (
      !this.isRoomMember(
        room.roomMembers,
        user.id,
        RoomMemberRole.Administrator,
        RoomMemberRole.Moderator,
      )
    ) {
      throw new AppError.AccessDenied();
    }

    this.roomsQueue.add(
      QUEUE_ROOM_EVENTS.UPDATE_ROOM_THEME,
      { room, dto },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
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
          RoomMemberRole.Administrator,
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
        this.isRoomMember(room.roomMembers, user.id, RoomMemberRole.None) ||
        this.isRoomMember(room.roomMembers, dto.memberId, RoomMemberRole.None)
      ) {
        throw new AppError.AccessDenied();
      }
      if (dto.role) {
        if (
          !room.isGroup ||
          !this.isRoomMember(
            room.roomMembers,
            user.id,
            RoomMemberRole.Administrator,
            RoomMemberRole.Moderator,
          )
        ) {
          throw new AppError.AccessDenied();
        }
        if (
          dto.role === RoomMemberRole.Administrator &&
          user.id !== dto.memberId &&
          this.isRoomMember(
            room.roomMembers,
            dto.memberId,
            RoomMemberRole.Administrator,
          ) &&
          !this.isRoomMember(
            room.roomMembers,
            user.id,
            RoomMemberRole.Administrator,
          )
        ) {
          throw new AppError.AccessDenied();
        }
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
        this.isRoomMember(room.roomMembers, user.id, RoomMemberRole.None) ||
        this.isRoomMember(room.roomMembers, dto.memberId, RoomMemberRole.None)
      ) {
        throw new AppError.AccessDenied();
      }
      if (
        this.isRoomMember(
          room.roomMembers,
          user.id,
          RoomMemberRole.Moderator,
          RoomMemberRole.Member,
        ) &&
        this.isRoomMember(
          room.roomMembers,
          dto.memberId,
          RoomMemberRole.Administrator,
        )
      ) {
        throw new AppError.AccessDenied();
      }
      if (
        this.isRoomMember(room.roomMembers, user.id, RoomMemberRole.Member) &&
        user.id !== dto.memberId &&
        this.isRoomMember(
          room.roomMembers,
          dto.memberId,
          RoomMemberRole.Administrator,
          RoomMemberRole.Moderator,
          RoomMemberRole.Moderator,
        )
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
          RoomMemberRole.Administrator,
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

      roomMessage.room.lastActivatedAt = roomMessage.createdAt;
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
          RoomMemberRole.Administrator,
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
      if (!message || message.type === RoomMessageType.None) {
        throw new AppError.NotFound();
      }
      if (!message.room.isGroup && message.user.id !== user.id) {
        throw new AppError.AccessDenied();
      }

      const members = await this.getMembersByRoomId({
        roomId: message.room.id,
      });
      if (
        (message.room.isGroup &&
          !(
            this.isRoomMember(
              members,
              user.id,
              RoomMemberRole.Administrator,
              RoomMemberRole.Moderator,
            ) ||
            (this.isRoomMember(members, user.id, RoomMemberRole.Member) &&
              message.user.id === user.id)
          )) ||
        (this.isRoomMember(members, user.id, RoomMemberRole.Moderator) &&
          this.isRoomMember(
            members,
            message.user.id,
            RoomMemberRole.Administrator,
          ))
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
          RoomMemberRole.Administrator,
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

      roomMessage.room.lastActivatedAt = roomMessage.createdAt;
      return roomMessage;
    });
  }

  async getFile(dto: SearchMessageFileDto, user: IdentityUser) {
    const room = await this.getRoomById({ id: dto.roomId });

    if (!room) {
      throw new AppError.NotFound();
    }

    if (this.isRoomMember(room.roomMembers, user.id, RoomMemberRole.None)) {
      throw new AppError.AccessDenied();
    }

    const { buffer } = await this.dropboxService.fileDownload(
      dto.name,
      dto.roomId,
    );

    return { buffer };
  }

  async getFileLink(dto: SearchMessageFileDto, user: IdentityUser) {
    const room = await this.getRoomById({ id: dto.roomId });

    if (!room) {
      throw new AppError.NotFound();
    }

    if (this.isRoomMember(room.roomMembers, user.id, RoomMemberRole.None)) {
      throw new AppError.AccessDenied();
    }

    const cacheKey = `room:${dto.roomId}|file:${dto.name}`;
    return this.cacheManager.wrap(
      cacheKey,
      () => this.dropboxService.getTemporaryLink(dto.name, dto.roomId),
      MessageFile.CACHE_TIME,
    );
  }

  async partitionFiles(files: Array<CreateFileMessageDto>) {
    const filesWithDetail = await Promise.all(
      files.map(async ({ name, type, data }) => {
        const mime = type;
        const extension = FileType.getFileExtension(name);

        return {
          name,
          buffer: data,
          type: (Regex.MessageFile.IMAGE_MIME_TYPES.test(mime)
            ? RoomMessageType.Images
            : Regex.MessageFile.AUDIO_MIME_TYPES.test(mime)
              ? RoomMessageType.Audios
              : Regex.MessageFile.VIDEO_MIME_TYPES.test(mime)
                ? RoomMessageType.Videos
                : Regex.MessageFile.OFFICE_MIME_TYPES.test(mime)
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
    RoomMessageType.Videos,
  ];

  isRoomMessageFileTypes(type: RoomMessageType) {
    return _.some(this.roomMessageFileTypes, (t) => t === type);
  }
}
