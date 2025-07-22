import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface MeetingRoomAttributes {
  id: number;
  name: string;
  capacity: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MeetingRoomCreationAttributes {
  name: string;
  capacity: number;
  is_active?: boolean;
}

export class MeetingRoom extends Model<MeetingRoomAttributes, MeetingRoomCreationAttributes> implements MeetingRoomAttributes {
  public id!: number;
  public name!: string;
  public capacity!: number;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

MeetingRoom.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'MeetingRoom',
  tableName: 'meeting_rooms',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});