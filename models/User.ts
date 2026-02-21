import mongoose, { Document, Schema } from 'mongoose';

interface IOtp {
  code: string;
  expiresIn: Date;
  isUsed: boolean;
}

export interface IUser extends Document {
  username: string;
  display_name: string;
  email: string;
  password: string;
  avatar_url?: string;
  last_seen?: Date;
  is_active: boolean;
  otp: IOtp;
  isVerified: boolean;
}

const otpSchema = new Schema<IOtp>({
  code: {
    type: String,
    required: true,
    maxLength: 6,
    minLength: 6,
  },
  expiresIn: {
    type: Date,
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
});
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      min: 4,
    },
    display_name: {
      type: String,
      required: false,
      min: 4,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar_url: {
      type: String,
      required: false,
    },
    last_seen: {
      type: Date,
      required: false,
    },
    is_active: {
      type: Boolean,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: otpSchema,
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
