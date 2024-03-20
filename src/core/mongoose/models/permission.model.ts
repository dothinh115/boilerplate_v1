import { Prop } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export default class DefaultPermission {
  @Prop({ auto: true })
  _id: mongoose.Schema.Types.ObjectId;
  @Prop({ required: true, type: mongoose.Schema.Types.String })
  path: string;
  @Prop({ required: true, type: mongoose.Schema.Types.String })
  method: string;
  @Prop({ type: mongoose.Schema.Types.Array, ref: 'Role' })
  roles: string[];
  @Prop({ default: false, type: mongoose.Schema.Types.Boolean })
  public: boolean;
}
