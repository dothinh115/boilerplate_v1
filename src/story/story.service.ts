import { Injectable } from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Story, StorySchema } from './schema/story.schema';
import { getLastKey, getLastValue, handleFilter, toSlug } from 'utils/function';

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
    let result: any;
    let pathArr: string[] = [];
    let select: any;
    let filter: any;
    if (query.populate) {
      const paths = query.populate
        .split(',')
        .filter((item: string) => item !== '');

      StorySchema.eachPath((storyPath) => {
        for (const path of paths) {
          if (path === storyPath) {
            pathArr = [...pathArr, path];
          }
        }
      });
    }
    if (query.fields) {
      const fieldArr = query.fields
        .split(',')
        .filter((item: string) => item !== '');
      for (const field of fieldArr) {
        select = {
          ...select,
          [field]: 1,
        };
      }
    }
    if (query.filter) {
      filter = handleFilter(query.filter);
    }
    result = await this.storyModel
      .find({ ...filter }, { ...select })
      .populate(pathArr);

    return result;
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
