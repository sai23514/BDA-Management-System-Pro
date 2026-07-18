import {
  Schema,
  model,
  type Model,
  type HydratedDocument,
  type Types,
} from 'mongoose';
import { CLIENT_STATUS, type ClientStatus } from '../utils/constants.js';
import { generateClientNumber } from '../utils/helpers.js';

export interface IClientAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface IClientBillingInfo {
  billingAddress?: string;
  paymentTerms?: string;
  creditLimit: number;
}

export interface IClient {
  leadId: Types.ObjectId;
  clientNumber: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry?: string;
  address?: IClientAddress;
  gst?: string;
  pan?: string;
  accountManager: Types.ObjectId;
  totalRevenue: number;
  activeContracts: number;
  status: ClientStatus;
  billingInfo?: IClientBillingInfo;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ClientModel = Model<IClient, {}>;
export type ClientDocument = HydratedDocument<IClient>;

const clientSchema = new Schema<IClient, ClientModel>(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
    },
    clientNumber: {
      type: String,
      unique: true,
      required: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: {
        type: String,
        default: 'India',
      },
      pincode: String,
    },
    gst: {
      type: String,
      trim: true,
      uppercase: true,
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true,
    },
    accountManager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeContracts: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(CLIENT_STATUS),
      default: CLIENT_STATUS.ACTIVE,
    },
    billingInfo: {
      billingAddress: String,
      paymentTerms: String,
      creditLimit: {
        type: Number,
        default: 0,
      },
    },
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
  },
);

clientSchema.index({ companyName: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ accountManager: 1 });
clientSchema.index({ status: 1 });

// Auto-generate client number before validation so required validation passes.
clientSchema.pre('validate', function (next) {
  if (!this.clientNumber) {
    this.clientNumber = generateClientNumber();
  }
  next();
});

const Client = model<IClient, ClientModel>('Client', clientSchema);

export default Client;
