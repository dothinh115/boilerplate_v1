import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesGuard } from '../guards/role.guard';
import { TQuery } from '../utils/models/query.model';
import { CustomRequest } from '../utils/models/request.model';

@UseGuards(RolesGuard)
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  create(@Body() body: CreateRoleDto, @Query() query: TQuery) {
    return this.roleService.create(body, query);
  }

  @Get()
  find(@Query() query: TQuery) {
    return this.roleService.find(query);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateRoleDto,
    @Query() query: TQuery,
    @Req() req: CustomRequest,
  ) {
    return this.roleService.update(id, body, query, req);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: CustomRequest) {
    return this.roleService.remove(id, req);
  }
}
