import {
  Schema,
  model,
  type Model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

export interface ITeamTargets {
  monthly: number;
  quarterly: number;
  yearly: number;
}

export interface ITeam {
  name: string;
  description?: string;
  teamLead: Types.ObjectId;
  members: Types.ObjectId[];
  targets: ITeamTargets;
  region?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TeamModel = Model<ITeam, {}>;
export type TeamDocument = HydratedDocument<ITeam>;

const teamSchema = new Schema<ITeam, TeamModel>(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Team name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    teamLead: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    targets: {
      monthly: { type: Number, default: 0 },
      quarterly: { type: Number, default: 0 },
      yearly: { type: Number, default: 0 },
    },
    region: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

teamSchema.index({ teamLead: 1 });
teamSchema.index({ isActive: 1 });

const Team = model<ITeam, TeamModel>('Team', teamSchema);

export default Team;
