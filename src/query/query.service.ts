import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { CommonService } from 'src/common/common.service';
import { numberRegex } from 'utils/model/common.model';
import { TPopulate, TQuery } from 'utils/model/query.model';

@Injectable()
export class QueryService {
  constructor(private commonService: CommonService) {}
  handleField(fields: string) {
    let fieldHandle: any = {},
      selectObj: any,
      fieldSplit: any[] = [];

    if (fields) {
      const fieldArr = fields.split(',').filter((item: string) => item !== '');

      for (const field of fieldArr) {
        if (field.includes('.')) {
          const nestedFieldArr = field
            .split('.')
            .filter((item: string) => item !== '');
          selectObj = {
            ...selectObj,
            [nestedFieldArr[0]]: 1,
          };
          const removeLastEl = nestedFieldArr.slice(0, -1).join('.');
          const lastEl = nestedFieldArr.slice(-1).join();
          if (!fieldHandle[removeLastEl])
            fieldHandle = {
              ...fieldHandle,
              [removeLastEl]: lastEl,
            };
          else {
            if (!fieldHandle[removeLastEl].includes('*'))
              fieldHandle[removeLastEl] =
                fieldHandle[removeLastEl] + ' ' + lastEl;
          }
        } else
          selectObj = {
            ...selectObj,
            [field]: 1,
          };
      }

      for (const [key, value] of Object.entries(fieldHandle)) {
        const keySplit = key.split('.').filter((item: string) => item !== '');
        let populateObj: TPopulate;
        if (keySplit.length > 1) {
          populateObj = keySplit.reduceRight(
            (prev: TPopulate, cur: string, index) => {
              return {
                path: cur,
                ...(index + 1 === keySplit.length
                  ? {
                      ...(value !== '*' && {
                        select: value as string,
                      }),
                    }
                  : { populate: prev }),
              };
            },
            { populate: {} },
          );
        } else {
          populateObj = {
            path: key,
            ...(value !== '*' && {
              select: value as string,
            }),
          };
        }

        let exist = false;
        //kiểm tra path đã tồn tại trong mảng chưa, nếu rồi thì phải merge các object cùng path với nhau
        for (let index in fieldSplit) {
          if (fieldSplit[index]['path'] === populateObj['path']) {
            const merge = {
              ...fieldSplit[index],
              ...populateObj,
            };
            fieldSplit[index] = merge;
            exist = true; //nếu đã có path tồn tại thì ko thêm mới vào mảng nữa
            break;
          }
        }
        //trong trường hợp có path mới thì thêm vào mảng
        if (!exist) fieldSplit = [...fieldSplit, populateObj];
      }
      for (const field of fieldArr) {
        if (field === '*') {
          selectObj = undefined;
          break;
        }
      }

      for (const item of fieldSplit) {
        if (item['select']?.includes('*')) delete item['select'];
      }
    }
    return {
      populate: fieldSplit,
      select: selectObj,
    };
  }

  handleFilter(object: object) {
    let result: typeof object = {},
      filterArr: any[] = [];
    for (const key in object) {
      if (Array.isArray(object[key])) {
        for (const filter of object[key]) {
          filterArr = [...filterArr, this.stringToNumberObject(filter)];
        }
        result = {
          [key]: filterArr,
        };
        return result;
      }
      //trong trường hợp tìm kiếm bằng title hoặc name thì đưa về slug để tìm
      if (key === 'title' || key === 'name') {
        for (const compareKey in object[key]) {
          return {
            slug: {
              //compare key sử dụng quy tắc của mongodb, ví dụ như $eq, $in, $regex...
              [compareKey]: this.commonService.toSlug(object[key][compareKey]),
            },
          };
        }
      } else
        return {
          [key]: this.stringToNumberObject(object[key]),
        };
    }
  }

  //hàm đưa giá trị cuối cùng của object về thành number nếu nó thực sự là number
  stringToNumberObject(value: object | string) {
    if (typeof value === 'string') {
      return +value;
    }
    for (const key in value) {
      if (typeof value[key] !== 'object') {
        return {
          [key]: numberRegex.test(value[key]) ? +value[key] : value[key],
        };
      }
      return {
        [key]: this.stringToNumberObject(value[key]),
      };
    }
  }

  async handleQuery<T>(model: Model<T>, query: TQuery, _id?: any) {
    const { fields, filter, page, limit, meta } = query;
    let selectObj: any,
      populate: any[] = [],
      result: any[],
      filterString: object = {},
      total_count: number,
      filter_count: number,
      metaSelect: string[] = [];
    if (fields) {
      populate = this.handleField(fields).populate;
      selectObj = this.handleField(fields).select;
    }
    if (filter) filterString = this.handleFilter(filter);
    if (meta)
      metaSelect = meta.split(',').filter((meta: string) => meta !== '');

    try {
      if (_id)
        result = await model.findById(_id, { ...selectObj }).populate(populate);
      else
        result = await model
          .find({ ...filterString }, { ...selectObj })
          .populate(populate)
          .skip((+page - 1) * +limit)
          .limit(+limit)
          .lean();
      for (const meta of metaSelect) {
        if (meta === '*') {
          total_count = await model.find().countDocuments();
          filter_count = await model.find({ ...filterString }).countDocuments();
          break;
        }
        if (meta === 'total_count')
          total_count = await model.find().countDocuments();
        if (meta === 'filter_count')
          filter_count = await model.find({ ...filterString }).countDocuments();
      }
    } catch (error) {}

    const data = {
      data: result,
    };
    for (const meta of metaSelect) {
      if (meta === '*') {
        data['meta'] = {
          total_count,
          filter_count,
        };
        break;
      }
      if (meta === 'total_count') data['meta'] = { total_count };
      if (meta === 'filter_count') data['meta'] = { filter_count };
    }

    return data;
  }
}
