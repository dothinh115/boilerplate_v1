import { TQuery } from '@/core/utils/models/query.model';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueryService } from '../query/query.service';
import { TMethod, DynamicRouteHandler } from '../handler/handler.interface';
import { CustomRequest } from '@/core/utils/models/request.model';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

@Injectable()
export class DynamicService {
  private handlerOptions: {
    route: string;
    provider: DynamicRouteHandler;
  }[] = [];

  private validateOptions: {
    route: string;
    provider: any;
  }[] = [];
  constructor(private queryService: QueryService) {
    this.handlerOptions = global.handlerOptions;
    this.validateOptions = global.validateOptions;
  }
  async create(
    body: any,
    query: TQuery,
    model: Model<any>,
    req: CustomRequest,
  ) {
    try {
      const name = req.params.name;
      const method = req.method as TMethod;
      const handler: DynamicRouteHandler = this.handlerOptions.find(
        (x) => x.route === name,
      )?.provider;
      const dto = this.validateOptions.find((x) => x.route === name)?.provider;
      const toInstance = plainToInstance(dto, body);
      const errors = await validate(toInstance);
      if (errors.length > 0) {
        const errorArr: string[] = [];
        for (const error of errors) {
          for (const key in error.constraints) {
            errorArr.push(error.constraints[key]);
          }
        }
        throw new Error(errorArr.join(', '));
      }
      if (handler)
        await handler.handleBefore(method, model, body, undefined, req);

      const result = await model.create(body);
      if (handler)
        await handler.handleAfter(method, model, body, undefined, req);
      return await this.queryService.handleQuery(model, query, result._id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async find(query: TQuery, model: Model<any>, req: CustomRequest) {
    try {
      const name = req.params.name;
      const method = req.method as TMethod;
      let handler: DynamicRouteHandler = this.handlerOptions.find(
        (x) => x.route === name,
      )?.provider;
      if (handler) await handler.handleBefore(method, model);
      const result = await this.queryService.handleQuery(model, query);
      if (handler) await handler.handleAfter(method, model);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(
    id: string | number,
    body: any,
    query: TQuery,
    model: Model<any>,
    req: CustomRequest,
  ) {
    // try {
    const name = req.params.name;
    const method = req.method as TMethod;
    const handler: DynamicRouteHandler = this.handlerOptions.find(
      (x) => x.route === name,
    )?.provider;
    // const dto = this.validateOptions.find((x) => x.route === name)?.provider;
    // const toInstance = plainToInstance(PartialType(dto), body);
    // const errors = await validate(toInstance);
    // if (errors.length > 0) {
    //   const errorArr: string[] = [];
    //   for (const error of errors) {
    //     for (const key in error.constraints) {
    //       errorArr.push(error.constraints[key]);
    //     }
    //   }
    //   throw new Error(errorArr.join(', '));
    // }
    if (handler) await handler.handleBefore(method, model, body, id, req);
    const exists = await model.exists({ _id: id });
    if (!exists) throw new Error('Không có record này trong hệ thống!');
    const result = await model.findByIdAndUpdate(id, body);
    if (handler) handler.handleAfter(method, model, body, id, req);
    return await this.queryService.handleQuery(model, query, result._id);
    // } catch (error) {
    //   throw new BadRequestException(error.message);
    // }
  }

  async remove(id: string | number, model: Model<any>, req: CustomRequest) {
    try {
      const name = req.params.name;
      const method = req.method as TMethod;
      const handler: DynamicRouteHandler = this.handlerOptions.find(
        (x) => x.route === name,
      )?.provider;
      if (handler)
        await handler.handleBefore(method, model, undefined, id, req);
      const exists = await model.exists({ _id: id });
      if (!exists) throw new Error('Không có record này trong hệ thống!');
      await model.findByIdAndDelete(id);
      if (handler) await handler.handleAfter(method, model, undefined, id, req);

      return {
        message: 'Thành công xoá record có id ' + id,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
