import mongoose, { Schema, models, model } from "mongoose";

export interface ISettings {
  resendApiKey: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  updatedAt?: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    resendApiKey: { type: String, required: true },
    fromEmail: { type: String, required: true },
    fromName: { type: String, default: "" },
    replyTo: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Settings =
  models.Settings || model<ISettings>("Settings", SettingsSchema);

export async function getSettings() {
  return Settings.findOne().lean<ISettings & { _id: mongoose.Types.ObjectId }>();
}
