import { Injectable } from '@nestjs/common';
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
      throw new AppError.NotFound();
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

        return tx.role.create({
          data: {
            name: dto.name,
            sort: maxSort !== null ? maxSort + 1 : 1,
          },
          select: roleSelect,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async update(dto: UpdateRoleDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const role = await this.findById({ id: dto.id });
        if (role.default) {
          throw new AppError.Argument(AppError.Messages.DefaultDataError);
        }

        return tx.role.update({
          where: { id: dto.id },
          data: {
            name: dto.name,
          },
          select: roleSelect,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async delete(dto: DeleteRoleDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const role = await this.findById({ id: dto.id });
        if (role.default) {
          throw new AppError.Argument(AppError.Messages.DefaultDataError);
        }

        const deleted = await tx.role.delete({
          where: { id: dto.id },
          select: roleSelect,
        });

        await tx.role.updateMany({
          data: { sort: { decrement: 1 } },
          where: { sort: { gt: deleted.sort } },
        });

        return deleted;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async sort(dto: SortRoleDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const maxSort = await this.maxSort(tx);

        if (dto.sort > maxSort) {
          throw new AppError.Argument(
            'Sort is greater than max sort',
          ).setErrors([`Max sort is ${maxSort}, current sort is ${dto.sort}`]);
        }

        const newsort = dto.sort;
        const role = await tx.role.findUnique({
          where: { id: dto.id },
          select: { sort: true },
        });

        if (!role) {
          throw new AppError.NotFound(
            AppError.Messages.NotFoundEntityError('role', dto.id),
          );
        }

        const oldSort = role.sort;

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
          throw new AppError.Argument('No Change');
        }

        return tx.role.update({
          where: { id: dto.id },
          data: {
            sort: dto.sort,
          },
          select: roleSelect,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
