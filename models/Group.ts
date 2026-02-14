import mongoose, { Document, Schema, Types } from "mongoose";

interface IGroup extends Document {
  chat_id: Types.ObjectId;
  name: string;
  description: string;
  avatar_url?: string;
  created_by: Types.ObjectId;
}

interface IGroupRoles extends Document {
  group_id: Types.ObjectId;
  user_id: Types.ObjectId;
  assigned_by: Types.ObjectId;
  role: string;
  assigned_at: Date;
}

const groupSchema = new Schema<IGroup>({
  chat_id: {
    type: Schema.Types.ObjectId,
    ref: "Chat",
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  name: {
    type: String,
    min: 3,
    required: true,
  },
  description: String,
  avatar_url: String,
});

const groupRoleSchema = new Schema<IGroupRoles>({
  group_id: {
    type: Types.ObjectId,
    ref: "Group",
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  assigned_by: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  role: {
    type: String,
    required: true,
    min: 3,
  },
  assigned_at: Date,
});

export const Group =
  mongoose.models.Group || mongoose.model("Group", groupSchema);
export const GroupRole =
  mongoose.models.GroupRole || mongoose.model("GroupRole", groupRoleSchema);
