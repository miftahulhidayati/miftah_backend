import { Request, Response } from 'express';
import { Unit, MeetingRoom, Consumption } from '../models';

export class MasterController {
  // Get all units
  static async getUnits(req: Request, res: Response) {
    try {
      const units = await Unit.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']],
      });

      res.json({
        success: true,
        data: units,
        message: 'Units retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching units:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Get all meeting rooms
  static async getRooms(req: Request, res: Response) {
    try {
      const rooms = await MeetingRoom.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']],
      });

      res.json({
        success: true,
        data: rooms,
        message: 'Meeting rooms retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching rooms:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // Get all consumptions
  static async getConsumptions(req: Request, res: Response) {
    try {
      const consumptions = await Consumption.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']],
      });

      res.json({
        success: true,
        data: consumptions,
        message: 'Consumptions retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching consumptions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}