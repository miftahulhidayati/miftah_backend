import sequelize from '../config/database';
import { Unit } from './Unit';
import { MeetingRoom } from './MeetingRoom';
import { Consumption } from './Consumption';
import { Booking } from './Booking';
import { BookingConsumption } from './BookingConsumption';

// Define associations
Unit.hasMany(Booking, { foreignKey: 'unit_id', as: 'bookings' });
Booking.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });

MeetingRoom.hasMany(Booking, { foreignKey: 'meeting_room_id', as: 'bookings' });
Booking.belongsTo(MeetingRoom, { foreignKey: 'meeting_room_id', as: 'meeting_room' });

Booking.belongsToMany(Consumption, {
  through: BookingConsumption,
  foreignKey: 'booking_id',
  otherKey: 'consumption_id',
  as: 'consumptions',
});

Consumption.belongsToMany(Booking, {
  through: BookingConsumption,
  foreignKey: 'consumption_id',
  otherKey: 'booking_id',
  as: 'bookings',
});

// Export all models
export {
  sequelize,
  Unit,
  MeetingRoom,
  Consumption,
  Booking,
  BookingConsumption,
};

// Database sync function
export const syncDatabase = async (force = false) => {
  try {
    if (force) {
      console.log('🔄 Force syncing database (dropping and recreating tables)...');
      await sequelize.sync({ force: true });
      console.log('✅ Database force synced successfully!');
      console.log('🌱 Seeding initial data...');
      await seedData();
    } else {
      console.log('🔄 Syncing database (creating tables if not exist)...');
      await sequelize.sync({ alter: true });
      console.log('✅ Database synced successfully!');
    }
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    throw error;
  }
};

// Seed data function
export const seedData = async () => {
  try {
    // Seed units
    await Unit.bulkCreate([
      { name: 'IT Department' },
      { name: 'HR Department' },
      { name: 'Finance Department' },
      { name: 'Marketing Department' },
    ], { ignoreDuplicates: true });

    // Seed meeting rooms
    await MeetingRoom.bulkCreate([
      { name: 'Conference Room A', capacity: 10 },
      { name: 'Conference Room B', capacity: 6 },
      { name: 'Small Meeting Room', capacity: 4 },
      { name: 'Board Room', capacity: 20 },
    ], { ignoreDuplicates: true });

    // Seed consumptions
    await Consumption.bulkCreate([
      { name: 'Coffee' },
      { name: 'Tea' },
      { name: 'Snacks' },
      { name: 'Lunch Box' },
      { name: 'Water' },
    ], { ignoreDuplicates: true });

    console.log('Seed data inserted successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
};