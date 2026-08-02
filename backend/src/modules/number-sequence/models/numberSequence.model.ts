import { Document, Model, Schema, Types, model } from 'mongoose';
import {
  DEFAULT_PADDING_LENGTH,
  DEFAULT_SEPARATOR,
  DOCUMENT_TYPES,
  DocumentType,
} from '../utils/documentTypes';

export interface INumberSequence {
  businessId: Types.ObjectId;
  documentType: DocumentType;
  prefix: string;
  currentNumber: number;
  startingNumber: number;
  paddingLength: number;
  separator: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INumberSequenceDocument extends INumberSequence, Document {
  _id: Types.ObjectId;
}

const numberSequenceSchema = new Schema<INumberSequenceDocument>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: DOCUMENT_TYPES,
      required: true,
      index: true,
    },
    prefix: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 10,
    },
    currentNumber: {
      type: Number,
      required: true,
      min: 0,
    },
    startingNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    paddingLength: {
      type: Number,
      required: true,
      min: 3,
      max: 10,
      default: DEFAULT_PADDING_LENGTH,
    },
    separator: {
      type: String,
      required: true,
      maxlength: 1,
      default: DEFAULT_SEPARATOR,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

numberSequenceSchema.index({ businessId: 1, documentType: 1 }, { unique: true });

export const NumberSequence: Model<INumberSequenceDocument> = model<INumberSequenceDocument>(
  'NumberSequence',
  numberSequenceSchema,
);
