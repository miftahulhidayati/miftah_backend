import { Router } from 'express';
import { BookingController } from '../controllers/bookingController';

const router = Router();

router.get('/', BookingController.getBookings);
router.post('/', BookingController.createBooking);
router.get('/availability', BookingController.checkAvailability);
router.get('/working-hours', BookingController.getWorkingHours);
router.get('/:id', BookingController.getBookingById);
router.put('/:id', BookingController.updateBooking);
router.delete('/:id', BookingController.deleteBooking);

export default router;