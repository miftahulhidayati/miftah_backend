import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface ConsumptionAttributes {
  id: number;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ConsumptionCreationAttributes {
  name: string;
  is_active?: boolean;
}

export class Consumption extends Model<ConsumptionAttributes, ConsumptionCreationAttributes> implements ConsumptionAttributes {
  public id!: number;
  public name!: string;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

Consumption.init({
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
  modelName: 'Consumption',
  tableName: 'consumptions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});