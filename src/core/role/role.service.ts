import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { TQuery } from '../utils/models/query.model';
import { InjectModel } from '@nestjs/mongoose';
import { Role } from './schema/role.schema';
import { Model } from 'mongoose';
import { QueryService } from '../query/query.service';
import { CustomRequest } from '../utils/models/request.model';
import { CommonService } from '../common/common.service';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<Role>,
    private queryService: QueryService,
    private commonService: CommonService,
  ) {}
  async create(body: CreateRoleDto, query: TQuery) {
    try {
      const exist = await this.roleModel.findOne({
        title: body.title,
      });
      if (exist) throw new Error('Role này đã tồn tại trong hệ thống!');
      const result = await this.roleModel.create(body);
      return await this.queryService.handleQuery(
        this.roleModel,
        query,
        result._id,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async find(query: TQuery) {
    return await this.queryService.handleQuery(this.roleModel, query);
  }

  async update(
    id: string,
    body: UpdateRoleDto,
    query: TQuery,
    req: CustomRequest,
  ) {
    try {
      const exist: any = await this.roleModel
        .findById(id)
        .select('+record_creater');
      if (!exist) throw new Error('Không có role này trong hệ thống!');
      const isValid = this.commonService.permissionCheck(exist, req);
      if (!isValid)
        throw new Error('Bạn không có quyền chỉnh sửa hoặc xoá record này!');
      const result = await this.roleModel.findByIdAndUpdate(id, body);
      return await this.queryService.handleQuery(
        this.roleModel,
        query,
        result._id,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: string, req: CustomRequest) {
    try {
      const exist: any = await this.roleModel
        .findById(id)
        .select('+record_creater');
      if (!exist) throw new Error('Không có role này trong hệ thống!');
      const isValid = this.commonService.permissionCheck(exist, req);
      if (!isValid)
        throw new Error('Bạn không có quyền chỉnh sửa hoặc xoá record này!');
      await this.roleModel.findByIdAndDelete(id);
      return {
        message: 'Thành công!',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
