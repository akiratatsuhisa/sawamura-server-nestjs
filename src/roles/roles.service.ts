import { messages } from '@akiratatsuhisa/sawamura-utils';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppError } from 'src/common/errors';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  CreateRoleDto,
  DeleteRoleDto,
  SearchRoleDto,
  SortRoleDto,
  UpdateRoleDto,
} from './dtos';
import { roleSelect } from './roles.factory';

@Injectable()
export class RolesService {
  private logger = new Logger(RolesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: [{ sort: 'asc' }],
      select: roleSelect,
    });
  }

  async findById(dto: SearchRoleDto) {
    const role = await this.prisma.role.findUnique({
      where: { id: dto.id },
      select: roleSelect,
    });

    if (!role) {
      throw new AppError.NotFound(messages.error.notFoundEntity).setParams({
        entity: 'Role',
        id: dto.id,
      });
    }

    return role;
  }

  private async maxSort(tx: Prisma.TransactionClient) {
    const {
      _max: { sort },
    } = await tx.role.aggregate({ _max: { sort: true } });
    return sort;
  }

  async create(dto: CreateRoleDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const maxSort = await this.maxSort(tx);

        const role = await tx.role.create({
          data: {
            name: dto.name,
            sort: maxSort !== null ? maxSort + 1 : 1,
          },
          select: roleSelect,
        });

        this.logger.log(`[Create]:${role.name}`);
        return role;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async update(dto: UpdateRoleDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const currentRole = await this.findById({ id: dto.id });

        if (currentRole.default) {
          throw new AppError.Argument(messages.warning.defaultData);
        }

        const role = await tx.role.update({
          where: { id: dto.id },
          data: {
            name: dto.name,
          },
          select: roleSelect,
        });

        this.logger.log(`[Update]:${role.name}`);
        return role;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async delete(dto: DeleteRoleDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const currentRole = await this.findById({ id: dto.id });

        if (currentRole.default) {
          throw new AppError.Argument(messages.warning.defaultData);
        }

        const role = await tx.role.delete({
          where: { id: dto.id },
          select: roleSelect,
        });

        await tx.role.updateMany({
          data: { sort: { decrement: 1 } },
          where: { sort: { gt: role.sort } },
        });

        this.logger.warn(`[Delete]:${role.name}`);
        return role;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async sort(dto: SortRoleDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const maxSort = await this.maxSort(tx);

        if (dto.sort > maxSort) {
          throw new AppError.Argument(messages.error.changeSort).setErrors([
            `Max sort is ${maxSort}, current sort is ${dto.sort}`,
          ]);
        }

        const newsort = dto.sort;
        const currentRole = await tx.role.findUnique({
          where: { id: dto.id },
          select: { sort: true },
        });

        if (!currentRole) {
          throw new AppError.NotFound(messages.error.notFoundEntity).setParams({
            entity: 'Role',
            id: dto.id,
          });
        }

        const oldSort = currentRole.sort;

        if (oldSort < newsort) {
          await tx.role.updateMany({
            data: { sort: { decrement: 1 } },
            where: { sort: { lte: newsort, gt: oldSort } },
          });
        } else if (oldSort > newsort) {
          await tx.role.updateMany({
            data: { sort: { increment: 1 } },
            where: { sort: { gte: newsort, lt: oldSort } },
          });
        } else {
          throw new AppError.Argument(messages.warning.noChange);
        }

        const role = await tx.role.update({
          where: { id: dto.id },
          data: {
            sort: dto.sort,
          },
          select: roleSelect,
        });

        this.logger.warn(`[Sort]:${role.name}`);
        return role;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
