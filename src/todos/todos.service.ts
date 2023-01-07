import { Injectable } from '@nestjs/common';
import { Prisma, Todo } from '@prisma/client';
import { IdentityUser } from 'src/auth/decorators/users.decorator';
import { AppError } from 'src/helpers/errors.helper';
import { messages } from 'src/helpers/messages.helper';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  CreateTodoDto,
  DeleteTodoDto,
  SortTodoDto,
  UpdateTodoDto,
} from './dtos';

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Array<Todo>> {
    return this.prisma.todo.findMany({
      orderBy: [{ sort: 'asc' }],
    });
  }

  private async maxSort(tx: Prisma.TransactionClient) {
    const {
      _max: { sort },
    } = await tx.todo.aggregate({ _max: { sort: true } });
    return sort;
  }

  async create(dto: CreateTodoDto, user: IdentityUser): Promise<Todo> {
    return this.prisma.$transaction(
      async (tx) => {
        const maxSort = await this.maxSort(tx);

        return tx.todo.create({
          data: {
            title: dto.title,
            description: dto.description,
            sort: maxSort !== null ? maxSort + 1 : 1,
            userId: user.id,
          },
          include: { user: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async update(dto: UpdateTodoDto, user: IdentityUser): Promise<Todo> {
    return this.prisma.todo.update({
      data: {
        title: dto.title,
        description: dto.description,
        userId: user.id,
      },
      where: { id: dto.id },
      include: { user: true },
    });
  }

  async sort(dto: SortTodoDto, user: IdentityUser): Promise<Todo> {
    return this.prisma.$transaction(
      async (tx) => {
        const maxSort = await this.maxSort(tx);
        if (dto.sort > maxSort) {
          throw new AppError.Argument('Sort is greater than max sort')
            .setErrors([`Max sort is ${maxSort}, current sort is ${dto.sort}`])
            .setData([{ sort: dto.sort }, { maxSort }]);
        }

        const newsort = dto.sort;
        const todo = await tx.todo.findUnique({
          select: { sort: true },
          where: { id: dto.id },
        });

        if (!todo) {
          throw new AppError.NotFound(
            messages.NotFoundEntityError('todo', dto.id),
          );
        }

        const oldSort = todo.sort;

        if (oldSort < newsort) {
          await tx.todo.updateMany({
            data: { sort: { decrement: 1 } },
            where: { sort: { lte: newsort, gt: oldSort } },
          });
        } else if (oldSort > newsort) {
          await tx.todo.updateMany({
            data: { sort: { increment: 1 } },
            where: { sort: { gte: newsort, lt: oldSort } },
          });
        } else {
          throw new AppError.Argument('No Change');
        }

        return tx.todo.update({
          data: {
            sort: dto.sort,
            userId: user.id,
          },
          where: { id: dto.id },
          include: { user: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async delete(dto: DeleteTodoDto): Promise<Todo> {
    return this.prisma.$transaction(
      async (tx) => {
        const deleted = await tx.todo.delete({
          where: { id: dto.id },
          include: { user: true },
        });

        await tx.todo.updateMany({
          data: { sort: { decrement: 1 } },
          where: { sort: { gt: deleted.sort } },
        });

        return deleted;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return;
  }
}
