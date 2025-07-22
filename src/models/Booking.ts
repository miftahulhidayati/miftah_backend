import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface BookingAttributes {
  id: number;
  unit_id: number;
  meeting_room_id: number;
  meeting_date: string;
  start_time: string;
  end_time: string;
  total_participants: number;
  total_consumption: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface BookingCreationAttributes {
  unit_id: number;
  meeting_room_id: number;
  meeting_date: string;
  start_time: string;
  end_time: string;
  total_participants: number;
  total_consumption?: number;
  notes?: string;
}

export class Booking extends Model<BookingAttributes, BookingCreationAttributes> implements BookingAttributes {
  public id!: number;
  public unit_id!: number;
  public meeting_room_id!: number;
  public meeting_date!: string;
  public start_time!: string;
  public end_time!: string;
  public total_participants!: number;
  public total_consumption!: number;
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;
}

Booking.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  unit_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'units',
      key: 'id',
    },
  },
  meeting_room_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'meeting_rooms',
      key: 'id',
    },
  },
  meeting_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  total_participants: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  total_consumption: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  modelName: 'Booking',
  tableName: 'bookings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});