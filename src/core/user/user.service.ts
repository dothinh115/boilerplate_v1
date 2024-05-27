import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';
import { QueryService } from '../query/query.service';
import { TQuery } from '../utils/models/query.model';
import { UpdateUserDto } from './dto/update-user.dto';
import { CustomRequest } from '../utils/models/request.model';
import { CreateUserDto } from './dto/create-user.dto';
import { CommonService } from '../common/common.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private queryService: QueryService,
    private commonService: CommonService,
  ) {}

  async create(query: TQuery, body: CreateUserDto) {
    try {
      const exist = await this.userModel.findOne({
        email: body.email,
      });
      if (exist) throw new Error('Email đã được sử dụng');
      const result = await this.userModel.create(body);
      return await this.queryService.handleQuery(
        this.userModel,
        query,
        result._id,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async find(query: TQuery) {
    return await this.queryService.handleQuery(this.userModel, query);
  }

  async update(
    query: TQuery,
    id: string,
    body: UpdateUserDto,
    req: CustomRequest,
  ) {
    try {
      //tìm xem user có nằm trong hệ thống hay ko
      const exist: any = await this.userModel
        .findById(id)
        .select('+record_creater');
      if (!exist) throw new Error('Không có user này trong hệ thống!');
      //kiểm tra xem có phải đang update rootUser hay ko và ngăn chặn lại
      const user = req.user;
      if (exist.rootUser && !user.rootUser) {
        throw new Error('Không được update rootUser!');
      }

      const isValid = this.commonService.permissionCheck(exist, req);
      if (!isValid)
        throw new Error('Bạn không có quyền chỉnh sửa hoặc xoá record này!');

      const result = await this.userModel.findByIdAndUpdate(id, body);
      return await this.queryService.handleQuery(
        this.userModel,
        query,
        result._id,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: string, req: CustomRequest) {
    try {
      const exist: any = await this.userModel
        .findById(id)
        .select('+record_creater');
      if (!exist) throw new Error('Không có user này trong hệ thống!');
      //kiểm tra xem có phải đang update rootUser hay ko và ngăn chặn lại
      if (exist.rootUser) {
        throw new Error('Không được xoá rootUser!');
      }
      const isValid = this.commonService.permissionCheck(exist, req);
      if (!isValid)
        throw new Error('Bạn không có quyền chỉnh sửa hoặc xoá record này!');
      await this.userModel.findByIdAndDelete(id);
      return {
        message: 'Thành công!',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
