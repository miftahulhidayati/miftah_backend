import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'meeting_booking',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'password123',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  timezone: '+07:00', // Asia/Jakarta
});

export default sequelize;