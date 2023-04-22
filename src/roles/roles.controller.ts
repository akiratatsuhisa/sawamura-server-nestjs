import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SearchRoomDto } from 'src/rooms/dtos';

import {
  CreateRoleDto,
  DeleteRoleDto,
  SortRoleDto,
  UpdateRoleDto,
} from './dtos';
import { RolesInterceptor } from './roles.interceptor';
import { RolesService } from './roles.service';

@Roles('Administrator')
@Controller('roles')
@UseInterceptors(RolesInterceptor)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  async search() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  async getById(@Query() dto: SearchRoomDto) {
    return this.rolesService.findById(dto);
  }

  @Post()
  async create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Put(':id')
  async update(@Body() dto: UpdateRoleDto) {
    return this.rolesService.update(dto);
  }

  @Delete(':id')
  async delete(@Body() dto: DeleteRoleDto) {
    return this.rolesService.delete(dto);
  }

  @Patch(':id/sort')
  async sort(@Body() dto: SortRoleDto) {
    return this.rolesService.sort(dto);
  }
}
