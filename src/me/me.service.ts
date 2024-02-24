import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/user/schema/user.schema';
import { Model } from 'mongoose';
import { QueryService } from 'src/query/query.service';
import { TQuery } from 'src/utils/model/query.model';

@Injectable()
export class MeService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private queryService: QueryService,
  ) {}

  async find(_id: string, query: TQuery) {
    return await this.queryService.handleQuery(this.userModel, query, _id);
  }
}
