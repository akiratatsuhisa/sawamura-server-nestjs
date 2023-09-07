import {
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { CACHE_MANAGER, Inject, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Cache } from 'cache-manager';
import { unlink } from 'fs/promises';
import _ from 'lodash';
import { DropboxService } from 'src/dropbox/dropbox.service';
import { IFile } from 'src/helpers/file.interface';
import { MaterialDesignService } from 'src/material-design/material-design.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { NAME, QUEUE_ROOM_EVENTS, SOCKET_ROOM_EVENTS } from './constants';
import {
  DeleteRoomImageDto,
  UpdateRoomImageDto,
  UpdateRoomThemeDto,
} from './dtos';
import { roomSelect } from './rooms.factory';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';

@Processor(NAME)
export class RoomsConsumer {
  private logger = new Logger(RoomsConsumer.name);

  constructor(
    private prisma: PrismaService,
    private dropboxService: DropboxService,
    private roomsGateway: RoomsGateway,
    private materialDesignService: MaterialDesignService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Process(QUEUE_ROOM_EVENTS.UPDATE_ROOM_IMAGE)
  async updateImage(
    job: Job<{
      room: Awaited<ReturnType<RoomsService['getRoomById']>>;
      fieldName: string;
      image?: IFile;
      dto: UpdateRoomImageDto;
    }>,
  ) {
    const { fieldName, room, dto, image } = job.data;

    const result = await this.dropboxService.fileUpload(image, {
      path: room.id,
      mode: { '.tag': 'overwrite' },
    });
    await this.cacheManager.del(`room:${dto.id}:${dto.type}`);

    const theme = dto.theme
      ? await this.materialDesignService.generateThemeFromImage(image)
      : {};

    await unlink(image.path);

    return this.prisma.room.update({
      data: {
        [fieldName]: result.pathDisplay,
        ...theme,
      },
      where: {
        id: room.id,
      },
      select: roomSelect,
    });
  }

  @Process(QUEUE_ROOM_EVENTS.DELETE_ROOM_IMAGE)
  async removeImage(
    job: Job<{
      room: Awaited<ReturnType<RoomsService['getRoomById']>>;
      fieldName: string;
      dto: DeleteRoomImageDto;
    }>,
  ) {
    const { fieldName, room } = job.data;

    await this.dropboxService.fileDelete(room[fieldName]);

    return this.prisma.room.update({
      data: {
        [fieldName]: null,
      },
      where: {
        id: room.id,
      },
      select: roomSelect,
    });
  }

  @Process(QUEUE_ROOM_EVENTS.UPDATE_ROOM_THEME)
  async updateTheme(
    job: Job<{
      room: Awaited<ReturnType<RoomsService['getRoomById']>>;
      dto: UpdateRoomThemeDto;
    }>,
  ) {
    const { room, dto } = job.data;

    const theme = !_.isNil(dto.source)
      ? await this.materialDesignService.generateThemeFromSource(dto.source)
      : { themeSource: null, themeStyle: null };

    return this.prisma.room.update({
      data: {
        ...theme,
      },
      where: {
        id: room.id,
      },
      select: roomSelect,
    });
  }

  @OnQueueCompleted()
  async onQueueCompleted(
    job: Job,
    room: Awaited<ReturnType<RoomsService['getRoomById']>>,
  ) {
    this.logger.log(
      `Completed room(${room.id}) queue proccess for job(${job.name})`,
    );

    this.roomsGateway.sendToUsers({
      event:
        job.name === QUEUE_ROOM_EVENTS.UPDATE_ROOM_THEME
          ? SOCKET_ROOM_EVENTS.UPDATE_ROOM
          : job.data.fieldName === 'coverUrl'
          ? SOCKET_ROOM_EVENTS.UPDATE_ROOM_COVER
          : SOCKET_ROOM_EVENTS.UPDATE_ROOM_PHOTO,
      dto: job.data.dto,
      data: room,
      userIds: this.roomsGateway.mapSendToRoomMembers(room),
    });
  }

  @OnQueueFailed()
  async onQueueFailed(job: Job, error: unknown) {
    this.logger.log(
      `Failed room(${job.data?.dto?.id ?? ''}) queue proccess for job(${
        job.name
      })`,
    );

    const image: IFile | undefined = job.data.image;
    if (image) {
      await unlink(image.path);
    }

    this.logger.error(error);
  }
}
