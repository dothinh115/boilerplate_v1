import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TQuery } from 'src/utils/model/query.model';
import { Route } from './schema/route.schema';
import { Model } from 'mongoose';
import { QueryService } from 'src/query/query.service';
import { ResponseService } from 'src/response/response.service';

@Injectable()
export class RouteService {
  constructor(
    @InjectModel(Route.name) private routeModel: Model<Route>,
    private queryService: QueryService,
    private responseService: ResponseService,
  ) {}
  async find(query: TQuery) {
    const result = await this.queryService.handleQuery(this.routeModel, query);
    return this.responseService.successResponse(result);
  }
}