import mongoose, { Schema, models, model } from "mongoose";

export type ContactStatus = "pending" | "sent" | "failed";
export type CampaignStatus = "draft" | "sending" | "completed" | "failed";

export interface IContact {
  firstname: string;
  lastname: string;
  company: string;
  email: string;
  status: ContactStatus;
  resendId?: string;
  error?: string;
  sentAt?: Date;
}

export interface IColumnMapping {
  firstname: string;
  lastname: string;
  company: string;
  email: string;
}

export interface ICampaign {
  name: string;
  subject: string;
  html: string;
  status: CampaignStatus;
  mapping: IColumnMapping;
  contacts: IContact[];
  stats: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  startedAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    firstname: { type: String, default: "" },
    lastname: { type: String, default: "" },
    company: { type: String, default: "" },
    email: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    resendId: String,
    error: String,
    sentAt: Date,
  },
  { _id: false }
);

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    html: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "sending", "completed", "failed"],
      default: "draft",
    },
    mapping: {
      firstname: { type: String, default: "" },
      lastname: { type: String, default: "" },
      company: { type: String, default: "" },
      email: { type: String, required: true },
    },
    contacts: [ContactSchema],
    stats: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
    },
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

export const Campaign =
  models.Campaign || model<ICampaign>("Campaign", CampaignSchema);
