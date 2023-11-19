import { Injectable } from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Story } from './schema/story.schema';
import { handleFilter } from 'utils/handleFields';
import { toSlug } from 'utils/function';

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
    let result: any[] = [];
    let pathArr: any[] = [];
    let select: any;
    let filter: any;
    let total_count: number;
    let filter_count: number;
    if (query.fields) {
      //Bóc tách lấy các field cần
      let selectObj: any = {};
      const fieldArr = query.fields
        .split(',')
        .filter((item: string) => item !== '');
      // ['author.slug','author.title'];
      for (const field of fieldArr) {
        if (field.includes('.')) {
          const nestedFieldArr = field
            .split('.')
            .filter((item: string) => item !== '');
          select = {
            ...select,
            [nestedFieldArr[0]]: 1,
          };
          const removeLastEl = nestedFieldArr.slice(0, -1).join('.');
          const lastEl = nestedFieldArr.slice(-1).join();
          if (!selectObj[removeLastEl])
            selectObj = {
              ...selectObj,
              [removeLastEl]: lastEl,
            };
          else selectObj[removeLastEl] = selectObj[removeLastEl] + ' ' + lastEl;
        } else
          select = {
            ...select,
            [field]: 1,
          };
      }
      for (const [key, value] of Object.entries(selectObj)) {
        const keySplit = key.split('.').filter((item: string) => item !== '');
        let popuplateObj: any;
        if (keySplit.length > 1) {
          popuplateObj = keySplit.reduceRight(
            (prev: any, cur, index) => {
              return {
                path: cur,
                ...(index + 1 === keySplit.length
                  ? {
                      path: cur,
                      ...(value !== '*' && {
                        select: value,
                      }),
                    }
                  : { populate: prev }),
              };
            },
            { populate: {} },
          );
        } else {
          popuplateObj = {
            path: key,
            ...(value !== '*' && {
              select: value,
            }),
          };
        }
        pathArr = [...pathArr, popuplateObj];
      }
      for (const field of fieldArr) {
        if (field === '*') {
          select = undefined;
          break;
        }
      }
    }
    if (query.filter) {
      filter = handleFilter(query.filter);
    }
    try {
      result = await this.storyModel
        .find({ ...filter }, { ...select })
        .populate(pathArr)
        .skip(+query.page - 1 * +query.limit)
        .limit(+query.limit)
        .lean();
      total_count = await this.storyModel.find().count();
      filter_count = await this.storyModel.find({ ...filter }).count();
    } catch (error) {}
    return { data: result, meta: { total_count, filter_count } };
  }

  // async find(query: {
  //   fields: string;
  //   filter: object;
  //   limit: number;
  //   page: number;
  //   populate: string;
  //   meta: {
  //     total_count: boolean;
  //     filter_count: boolean;
  //   };
  // }) {
  //   let result: any[] = [];
  //   let pathArr: any[] = [];
  //   let select: any;
  //   let filter: any;
  //   let total_count: number;
  //   let filter_count: number;
  //   if (query.fields) {
  //     //Bóc tách lấy các field cần
  //     const fieldArr = query.fields
  //       .split(',')
  //       .filter((item: string) => item !== '');
  //     //chạy vòng lặp qua các field
  //     for (const field of fieldArr) {
  //       //kiểm tra xem có select nested field hay ko
  //       if (field.includes('.')) {
  //         const nestedField = field
  //           .split('.')
  //           .filter((item: string) => item !== '');
  //         //nếu có thì cần select tầng đầu tiên
  //         select = {
  //           ...select,
  //           [nestedField[0]]: 1,
  //         };
  //         //cần phải populate tầng đầu tiên
  //         let popuplateObj: any = {
  //           path: nestedField[0],
  //         };
  //         //tiếp tục lặp qua các field (bỏ qua tầng đầu tiên) để select các field bên trong
  //         for (const selectField of nestedField.slice(1)) {
  //           popuplateObj = {
  //             ...popuplateObj,
  //             //nếu ko phải là * thì add các field cần select vào, nếu là * thì bỏ trống -> lấy hết
  //             ...(selectField !== '*' && {
  //               select: popuplateObj['select']
  //                 ? popuplateObj['select'] + ' ' + selectField
  //                 : selectField,
  //             }),
  //           };
  //         }
  //         //tìm xem bên trong pathArr đã có tầng lớn nhất cần dc populate chưa
  //         const findIndex = pathArr.findIndex(
  //           (item: { path: string }) => item.path === popuplateObj['path'],
  //         );
  //         //nếu đã có thì tiến hành thay đổi trường select bên trong
  //         if (findIndex !== -1)
  //           pathArr[findIndex] = {
  //             ...pathArr[findIndex],
  //             select:
  //               pathArr[findIndex]['select'] + ' ' + popuplateObj['select'],
  //           };
  //         //nếu chưa có thì add vào
  //         else pathArr = [...pathArr, popuplateObj];
  //       } else
  //         select = {
  //           ...select,
  //           [field]: 1,
  //         };
  //     }
  //     for (const field of fieldArr) {
  //       if (field === '*') {
  //         select = undefined;
  //         break;
  //       }
  //     }
  //   }
  //   if (query.filter) {
  //     filter = handleFilter(query.filter);
  //   }
  //   try {
  //     result = await this.storyModel
  //       .find({ ...filter }, { ...select })
  //       .populate(pathArr)
  //       .skip(+query.page - 1 * +query.limit)
  //       .limit(+query.limit)
  //       .lean();
  //     total_count = await this.storyModel.find().count();
  //     filter_count = await this.storyModel.find({ ...filter }).count();
  //   } catch (error) {}
  //   return { data: result, meta: { total_count, filter_count } };
  // }

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
