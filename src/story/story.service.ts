import { Injectable } from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Story, StorySchema } from './schema/story.schema';
import { handleFilter, toSlug } from 'utils/function';

@Injectable()
export class StoryService {
  constructor(@InjectModel(Story.name) private storyModel: Model<Story>) {}

  async create(payload: CreateStoryDto) {
    const { title, category_id, description } = payload;
    const lastRecord = await this.storyModel.find().sort({ _id: -1 }).limit(1);

    const _id = lastRecord.length === 0 ? 1 : (lastRecord[0]._id as number) + 1;
    const data = {
      _id,
      title,
      author: payload.author,
      category: category_id,
      description,
      slug: toSlug(title),
    };
    const result = await this.storyModel.create(data);
    return result;
  }

  async find(query: {
    fields: string;
    filter: object;
    limit: number;
    page: number;
    populate: string;
    meta: {
      total_count: boolean;
      filter_count: boolean;
    };
  }) {
    let queryResult: any;
    let result: any[] = [];
    let pathArr: any[] = [];
    let select: any;
    let filter: any;
    let total_count: number;
    let filter_count: number;
    if (query.fields) {
      const fieldArr = query.fields
        .split(',')
        .filter((item: string) => item !== '');
      for (const field of fieldArr) {
        if (field.includes('.')) {
          const nestedField = field
            .split('.')
            .filter((item: string) => item !== '');
          select = {
            ...select,
            [nestedField[0]]: 1,
          };
          let popuplateObj: any = {
            path: nestedField[0],
          };
          for (const selectField of nestedField.slice(1)) {
            popuplateObj = {
              ...popuplateObj,
              ...(selectField !== '*' && {
                select: popuplateObj['select']
                  ? popuplateObj['select'] + ' ' + selectField
                  : selectField,
              }),
            };
          }
          const findIndex = pathArr.findIndex(
            (item: { path: string }) => item.path === popuplateObj['path'],
          );
          if (findIndex !== -1)
            pathArr[findIndex] = {
              ...pathArr[findIndex],
              select:
                pathArr[findIndex]['select'] + ' ' + popuplateObj['select'],
            };
          else pathArr = [...pathArr, popuplateObj];
        } else
          select = {
            ...select,
            [field]: 1,
          };
      }
    }
    if (query.filter) {
      filter = handleFilter(query.filter);
    }
    try {
      queryResult = await this.storyModel
        .find({ ...filter })
        .populate(pathArr)
        .skip(+query.page - 1 * +query.limit)
        .limit(+query.limit);
      total_count = await this.storyModel.find().count();
      filter_count = await this.storyModel.find({ ...filter }).count();
    } catch (error) {}
    if (select) {
      for (const field of Object.keys(select)) {
        if (field === '*') {
          result = queryResult;
          break;
        }
        for (const index in queryResult) {
          result = [
            ...result,
            {
              [field]: queryResult[index][field],
            },
          ];
        }
      }
    }
    return { data: result, meta: { total_count, filter_count } };
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} story`;
  // }

  // update(id: number, updateStoryDto: UpdateStoryDto) {
  //   return `This action updates a #${id} story`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} story`;
  // }
}
