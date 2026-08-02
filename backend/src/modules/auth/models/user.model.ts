import { Document, Model, Schema, Types, model } from 'mongoose';

export type UserRole = 'admin';

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  businessId: Types.ObjectId | null;
  businessSetupCompleted: boolean;
  refreshTokenHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
}

const userSchema = new Schema<IUserDocument>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin'],
      default: 'admin',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: 'Business',
    },
    businessSetupCompleted: {
      type: Boolean,
      default: false,
      required: true,
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const User: Model<IUserDocument> = model<IUserDocument>('User', userSchema);
