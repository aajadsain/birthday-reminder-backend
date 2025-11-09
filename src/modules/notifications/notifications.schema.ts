import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ required: true })
  date: string; // YYYY-MM-DD

  @Prop({ type: [String], default: [] })
  sentTo: string[];

  @Prop({ type: [String], default: [] })
  birthdayPeople: string[];
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
