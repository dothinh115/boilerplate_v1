import { Prop } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export class DefaultFile {
  @Prop({ auto: true, input: 'text', disabled: true })
  _id: mongoose.Schema.Types.ObjectId;
  @Prop({ required: true })
  originalName: string;
  @Prop({ required: true, type: mongoose.Schema.Types.String })
  mimeType: string;
  @Prop({ required: true, type: mongoose.Schema.Types.Number })
  size: number;
  @Prop({ required: true, ref: 'User', type: mongoose.Schema.Types.String })
  user: string;
  @Prop({ default: null, ref: 'Folder', type: mongoose.Schema.Types.String })
  folder: string;
  @Prop({ require: true, type: mongoose.Schema.Types.String })
>>>>>>> 16219c104cf27ea0f2dea25a3dae34d6bd956374
  extension: string;
}
