import { Op } from 'sequelize';
import { Booking, MeetingRoom } from '../models';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  code?: string;
}

export class ValidationUtils {
  // Working hours configuration (can be moved to environment later)
  private static readonly WORKING_HOURS = {
    START: '08:00',
    END: '18:00',
    WORKING_DAYS: [1, 2, 3, 4, 5], // Monday to Friday (0 = Sunday, 1 = Monday)
  };

  /**
   * Validate if the booking date is in the future
   */
  static validateFutureDate(meetingDate: string): ValidationResult {
    const today = new Date();
    const bookingDate = new Date(meetingDate);

    // Set today to start of day for comparison
    today.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return {
        isValid: false,
        message: 'Meeting date cannot be in the past',
        code: 'INVALID_DATE_PAST',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate if the booking is within working hours and working days
   */
  static validateWorkingHours(meetingDate: string, startTime: string, endTime: string): ValidationResult {
    const bookingDate = new Date(meetingDate);
    const dayOfWeek = bookingDate.getDay();

    // Check if it's a working day
    if (!this.WORKING_HOURS.WORKING_DAYS.includes(dayOfWeek)) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return {
        isValid: false,
        message: `Bookings are only allowed on working days (Monday-Friday). Selected day: ${dayNames[dayOfWeek]}`,
        code: 'INVALID_WORKING_DAY',
      };
    }

    // Validate time format and range
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return {
        isValid: false,
        message: 'Invalid time format. Use HH:MM format (24-hour)',
        code: 'INVALID_TIME_FORMAT',
      };
    }

    // Check if times are within working hours
    if (startTime < this.WORKING_HOURS.START || endTime > this.WORKING_HOURS.END) {
      return {
        isValid: false,
        message: `Bookings are only allowed during working hours (${this.WORKING_HOURS.START} - ${this.WORKING_HOURS.END})`,
        code: 'OUTSIDE_WORKING_HOURS',
      };
    }

    // Check if start time is before end time
    if (startTime >= endTime) {
      return {
        isValid: false,
        message: 'Start time must be before end time',
        code: 'INVALID_TIME_ORDER',
      };
    }

    // Check minimum booking duration (30 minutes)
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    const durationMinutes = endMinutes - startMinutes;

    if (durationMinutes < 30) {
      return {
        isValid: false,
        message: 'Minimum booking duration is 30 minutes',
        code: 'INVALID_DURATION_TOO_SHORT',
      };
    }

    // Check maximum booking duration (8 hours)
    if (durationMinutes > 480) {
      return {
        isValid: false,
        message: 'Maximum booking duration is 8 hours',
        code: 'INVALID_DURATION_TOO_LONG',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate room capacity against number of participants
   */
  static async validateRoomCapacity(roomId: number, participants: number): Promise<ValidationResult> {
    try {
      const room = await MeetingRoom.findByPk(roomId);

      if (!room) {
        return {
          isValid: false,
          message: 'Meeting room not found',
          code: 'ROOM_NOT_FOUND',
        };
      }

      if (!room.is_active) {
        return {
          isValid: false,
          message: 'Meeting room is currently inactive',
          code: 'ROOM_INACTIVE',
        };
      }

      if (participants > room.capacity) {
        return {
          isValid: false,
          message: `Number of participants (${participants}) exceeds room capacity (${room.capacity})`,
          code: 'CAPACITY_EXCEEDED',
        };
      }

      if (participants < 1) {
        return {
          isValid: false,
          message: 'Number of participants must be at least 1',
          code: 'INVALID_PARTICIPANTS_COUNT',
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validating room capacity:', error);
      return {
        isValid: false,
        message: 'Error validating room capacity',
        code: 'VALIDATION_ERROR',
      };
    }
  }

  /**
   * Check if the room is available for the specified time slot
   */
  static async validateRoomAvailability(
    roomId: number,
    meetingDate: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: number
  ): Promise<ValidationResult> {
    try {
      const whereCondition: any = {
        meeting_room_id: roomId,
        meeting_date: meetingDate,
        [Op.or]: [
          {
            start_time: {
              [Op.lt]: endTime,
            },
            end_time: {
              [Op.gt]: startTime,
            },
          },
        ],
      };

      // Exclude current booking when updating
      if (excludeBookingId) {
        whereCondition.id = { [Op.ne]: excludeBookingId };
      }

      const conflictingBooking = await Booking.findOne({
        where: whereCondition,
      });

      if (conflictingBooking) {
        return {
          isValid: false,
          message: `Time slot conflicts with existing booking (${conflictingBooking.start_time} - ${conflictingBooking.end_time})`,
          code: 'TIME_CONFLICT',
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validating room availability:', error);
      return {
        isValid: false,
        message: 'Error checking room availability',
        code: 'VALIDATION_ERROR',
      };
    }
  }

  /**
   * Validate all booking requirements at once
   */
  static async validateBooking(
    roomId: number,
    meetingDate: string,
    startTime: string,
    endTime: string,
    participants: number,
    excludeBookingId?: number
  ): Promise<ValidationResult[]> {
    const validations = await Promise.all([
      Promise.resolve(this.validateFutureDate(meetingDate)),
      Promise.resolve(this.validateWorkingHours(meetingDate, startTime, endTime)),
      this.validateRoomCapacity(roomId, participants),
      this.validateRoomAvailability(roomId, meetingDate, startTime, endTime, excludeBookingId),
    ]);

    return validations;
  }

  /**
   * Helper function to convert time string to minutes
   */
  private static timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get working hours configuration
   */
  static getWorkingHours() {
    return this.WORKING_HOURS;
  }
}