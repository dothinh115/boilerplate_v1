import { Prop } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export default class DefaultPermission {
  @Prop({ auto: true, input: 'text', disabled: true })
  _id: mongoose.Schema.Types.ObjectId;
  @Prop({ required: true })
  path: string;
  @Prop({ required: true })
  method: string;
  @Prop({ type: mongoose.Schema.Types.Array, ref: 'Role', input: 'array' })
  roles: string[];
  @Prop({ default: false })
  public: boolean;
}
