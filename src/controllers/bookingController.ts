import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Booking, BookingConsumption, Unit, MeetingRoom, Consumption } from '../models';
import { ValidationUtils } from '../utils/validationUtils';

interface CreateBookingRequest {
  unit_id: number;
  meeting_room_id: number;
  meeting_date: string;
  start_time: string;
  end_time: string;
  total_participants: number;
  total_consumption: number;
  consumption_ids: number[];
  notes?: string;
}

export class BookingController {
  // Get bookings with pagination and filters
  static async getBookings(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        unit_id,
        room_id,
        date_from,
        date_to,
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      // Build where conditions
      const whereConditions: any = {};

      if (unit_id) {
        whereConditions.unit_id = unit_id;
      }

      if (room_id) {
        whereConditions.meeting_room_id = room_id;
      }

      if (date_from || date_to) {
        whereConditions.meeting_date = {};
        if (date_from) {
          whereConditions.meeting_date[Op.gte] = date_from;
        }
        if (date_to) {
          whereConditions.meeting_date[Op.lte] = date_to;
        }
      }

      const { count, rows } = await Booking.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Unit,
            as: 'unit',
            attributes: ['id', 'name'],
          },
          {
            model: MeetingRoom,
            as: 'meeting_room',
            attributes: ['id', 'name', 'capacity'],
          },
          {
            model: Consumption,
            as: 'consumptions',
            attributes: ['id', 'name'],
            through: { attributes: [] },
          },
        ],
        order: [['created_at', 'DESC']],
        offset,
        limit: Number(limit),
      });

      const totalPages = Math.ceil(count / Number(limit));

      res.json({
        success: true,
        data: {
          bookings: rows,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count,
            totalPages,
          },
        },
        message: 'Bookings retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Get single booking by ID
  static async getBookingById(req: Request, res: Response) {
    try {
      const bookingId = Number(req.params.id);

      const booking = await Booking.findByPk(bookingId, {
        include: [
          {
            model: Unit,
            as: 'unit',
            attributes: ['id', 'name'],
          },
          {
            model: MeetingRoom,
            as: 'meeting_room',
            attributes: ['id', 'name', 'capacity'],
          },
          {
            model: Consumption,
            as: 'consumptions',
            attributes: ['id', 'name'],
            through: { attributes: [] },
          },
        ],
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND',
        });
      }

      res.json({
        success: true,
        data: booking,
        message: 'Booking retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching booking:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Create new booking
  static async createBooking(req: Request, res: Response) {
    const transaction = await Booking.sequelize!.transaction();

    try {
      const bookingData: CreateBookingRequest = req.body;

      // Validate required fields
      const requiredFields = ['unit_id', 'meeting_room_id', 'meeting_date', 'start_time', 'end_time', 'total_participants'];
      const missingFields = requiredFields.filter(field => !bookingData[field as keyof CreateBookingRequest]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
          code: 'MISSING_REQUIRED_FIELDS',
        });
      }

      // Run all validations
      const validationResults = await ValidationUtils.validateBooking(
        bookingData.meeting_room_id,
        bookingData.meeting_date,
        bookingData.start_time,
        bookingData.end_time,
        bookingData.total_participants
      );

      // Check if any validation failed
      const failedValidations = validationResults.filter(result => !result.isValid);
      if (failedValidations.length > 0) {
        const firstError = failedValidations[0];
        return res.status(400).json({
          success: false,
          message: firstError.message,
          code: firstError.code,
          validationErrors: failedValidations.map(v => ({ message: v.message, code: v.code })),
        });
      }

      // Create booking
      const booking = await Booking.create(
        {
          unit_id: bookingData.unit_id,
          meeting_room_id: bookingData.meeting_room_id,
          meeting_date: bookingData.meeting_date,
          start_time: bookingData.start_time,
          end_time: bookingData.end_time,
          total_participants: bookingData.total_participants,
          total_consumption: bookingData.total_consumption || 0,
          notes: bookingData.notes,
        },
        { transaction }
      );

      // Create booking consumptions
      if (bookingData.consumption_ids && bookingData.consumption_ids.length > 0) {
        const consumptionData = bookingData.consumption_ids.map((id) => ({
          booking_id: booking.id,
          consumption_id: id,
        }));

        await BookingConsumption.bulkCreate(consumptionData, { transaction });
      }

      await transaction.commit();

      // Fetch complete booking with relations
      const completeBooking = await Booking.findByPk(booking.id, {
        include: [
          {
            model: Unit,
            as: 'unit',
            attributes: ['id', 'name'],
          },
          {
            model: MeetingRoom,
            as: 'meeting_room',
            attributes: ['id', 'name', 'capacity'],
          },
          {
            model: Consumption,
            as: 'consumptions',
            attributes: ['id', 'name'],
            through: { attributes: [] },
          },
        ],
      });

      res.status(201).json({
        success: true,
        data: completeBooking,
        message: 'Booking created successfully',
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating booking:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Check room availability with enhanced validation
  static async checkAvailability(req: Request, res: Response) {
    try {
      const { room_id, date, start_time, end_time, participants } = req.query;

      if (!room_id || !date || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: room_id, date, start_time, end_time',
          code: 'MISSING_PARAMETERS',
        });
      }

      // Run validations
      const validationResults = await ValidationUtils.validateBooking(
        Number(room_id),
        String(date),
        String(start_time),
        String(end_time),
        participants ? Number(participants) : 1
      );

      // Separate different types of validation results
      const availabilityResult = validationResults[3]; // Room availability is the 4th validation
      const otherValidations = validationResults.slice(0, 3); // Date, working hours, capacity

      const validationErrors = validationResults
        .filter(result => !result.isValid)
        .map(v => ({ message: v.message, code: v.code }));

      res.json({
        success: true,
        data: {
          available: availabilityResult.isValid,
          validationsPassed: validationErrors.length === 0,
          validationErrors,
          workingHours: ValidationUtils.getWorkingHours(),
        },
        message: 'Availability check completed',
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Get working hours configuration
  static async getWorkingHours(req: Request, res: Response) {
    try {
      const workingHours = ValidationUtils.getWorkingHours();
      res.json({
        success: true,
        data: workingHours,
        message: 'Working hours retrieved successfully',
      });
    } catch (error) {
      console.error('Error getting working hours:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Update existing booking
  static async updateBooking(req: Request, res: Response) {
    const transaction = await Booking.sequelize!.transaction();

    try {
      const bookingId = Number(req.params.id);
      const updateData: Partial<CreateBookingRequest> = req.body;

      // Find existing booking
      const existingBooking = await Booking.findByPk(bookingId);
      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND',
        });
      }

      // Prepare data for validation (use existing values if not provided)
      const roomId = updateData.meeting_room_id ?? existingBooking.meeting_room_id;
      const meetingDate = updateData.meeting_date ?? existingBooking.meeting_date;
      const startTime = updateData.start_time ?? existingBooking.start_time;
      const endTime = updateData.end_time ?? existingBooking.end_time;
      const participants = updateData.total_participants ?? existingBooking.total_participants;

      // Run all validations (exclude current booking from availability check)
      const validationResults = await ValidationUtils.validateBooking(
        roomId,
        meetingDate,
        startTime,
        endTime,
        participants,
        bookingId // Exclude current booking
      );

      // Check if any validation failed
      const failedValidations = validationResults.filter(result => !result.isValid);
      if (failedValidations.length > 0) {
        const firstError = failedValidations[0];
        return res.status(400).json({
          success: false,
          message: firstError.message,
          code: firstError.code,
          validationErrors: failedValidations.map(v => ({ message: v.message, code: v.code })),
        });
      }

      // Update booking
      await existingBooking.update(
        {
          unit_id: updateData.unit_id ?? existingBooking.unit_id,
          meeting_room_id: roomId,
          meeting_date: meetingDate,
          start_time: startTime,
          end_time: endTime,
          total_participants: participants,
          total_consumption: updateData.total_consumption ?? existingBooking.total_consumption,
          notes: updateData.notes !== undefined ? updateData.notes : existingBooking.notes,
        },
        { transaction }
      );

      // Update consumptions if provided
      if (updateData.consumption_ids !== undefined) {
        // Delete existing consumption relationships
        await BookingConsumption.destroy({
          where: { booking_id: bookingId },
          transaction,
        });

        // Create new consumption relationships
        if (updateData.consumption_ids.length > 0) {
          const consumptionData = updateData.consumption_ids.map((id) => ({
            booking_id: bookingId,
            consumption_id: id,
          }));

          await BookingConsumption.bulkCreate(consumptionData, { transaction });
        }
      }

      await transaction.commit();

      // Fetch updated booking with relations
      const updatedBooking = await Booking.findByPk(bookingId, {
        include: [
          {
            model: Unit,
            as: 'unit',
            attributes: ['id', 'name'],
          },
          {
            model: MeetingRoom,
            as: 'meeting_room',
            attributes: ['id', 'name', 'capacity'],
          },
          {
            model: Consumption,
            as: 'consumptions',
            attributes: ['id', 'name'],
            through: { attributes: [] },
          },
        ],
      });

      res.json({
        success: true,
        data: updatedBooking,
        message: 'Booking updated successfully',
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating booking:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Delete booking
  static async deleteBooking(req: Request, res: Response) {
    const transaction = await Booking.sequelize!.transaction();

    try {
      const bookingId = Number(req.params.id);

      // Find existing booking
      const existingBooking = await Booking.findByPk(bookingId);
      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND',
        });
      }

      // Check if booking is in the past (optional business rule)
      const bookingDateTime = new Date(`${existingBooking.meeting_date} ${existingBooking.start_time}`);
      const now = new Date();

      if (bookingDateTime < now) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete bookings that have already started or passed',
          code: 'BOOKING_ALREADY_STARTED',
        });
      }

      // Delete booking consumptions first
      await BookingConsumption.destroy({
        where: { booking_id: bookingId },
        transaction,
      });

      // Delete the booking
      await existingBooking.destroy({ transaction });

      await transaction.commit();

      res.json({
        success: true,
        message: 'Booking deleted successfully',
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error deleting booking:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}