import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface BookingConsumptionAttributes {
  id: number;
  booking_id: number;
  consumption_id: number;
  created_at: Date;
}

export interface BookingConsumptionCreationAttributes {
  booking_id: number;
  consumption_id: number;
}

export class BookingConsumption extends Model<BookingConsumptionAttributes, BookingConsumptionCreationAttributes> implements BookingConsumptionAttributes {
  public id!: number;
  public booking_id!: number;
  public consumption_id!: number;
  public created_at!: Date;
}

BookingConsumption.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'bookings',
      key: 'id',
    },
  },
  consumption_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'consumptions',
      key: 'id',
    },
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'BookingConsumption',
  tableName: 'booking_consumptions',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['booking_id', 'consumption_id'],
    },
  ],
});