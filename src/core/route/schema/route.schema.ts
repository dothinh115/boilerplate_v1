import { DefaultRoute } from '@/core/mongoose/models/route.model';
import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RouteDocument = HydratedDocument<Route>;

@Schema()
export class Route extends DefaultRoute {}

export const RouteSchema = SchemaFactory.createForClass(Route);
