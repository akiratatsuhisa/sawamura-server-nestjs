import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { SearchMembersDto, SearchMessagesDto } from './dtos/search-room.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async getMembersByRoomId(query: SearchMembersDto) {
    return this.prisma.roomMember.findMany({ where: { roomId: query.roomId } });
  }

  async getMessagesByRoomId(query: SearchMessagesDto) {
    return this.prisma.roomMessage.findMany({
      where: { roomId: query.roomId },
    });
  }
}
