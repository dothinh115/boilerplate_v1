import { Prop } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export default class DefaultUser {
  @Prop({ required: true, lowercase: true })
  email: string;
  @Prop({ required: true, select: false })
  password: string;
  @Prop({ default: false })
  actived: boolean;
  @Prop({
    type: mongoose.Schema.Types.String,
    ref: 'Role',
    default: null,
  })
  role: string;
  @Prop({ default: false, immutable: true, select: false })
  rootUser: boolean;
}
