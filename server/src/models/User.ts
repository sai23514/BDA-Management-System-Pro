import {
  Schema,
  model,
  type Model,
  type HydratedDocument,
  type Types,
} from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, type Role } from '../utils/constants.js';

export interface IUserTargets {
  monthly: number;
  quarterly: number;
  yearly: number;
}

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  avatar: string | null;
  team: Types.ObjectId | null;
  department?: string;
  targets: IUserTargets;
  isActive: boolean;
  lastLogin: Date | null;
  refreshToken?: string | null;
  resetPasswordToken?: string | null;
  resetPasswordExpire?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type UserModel = Model<IUser, {}, IUserMethods>;
export type UserDocument = HydratedDocument<IUser, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.BDA,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid phone number'],
    },
    avatar: {
      type: String,
      default: null,
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    department: {
      type: String,
      trim: true,
    },
    targets: {
      monthly: { type: Number, default: 0 },
      quarterly: { type: Number, default: 0 },
      yearly: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ role: 1 });
userSchema.index({ team: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare a plaintext password against the stored hash
userSchema.methods.comparePassword = async function (
  this: UserDocument,
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual('fullName').get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = model<IUser, UserModel>('User', userSchema);

export default User;
