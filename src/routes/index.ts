import { Router } from 'express';
import masterRoutes from './masterRoutes';
import bookingRoutes from './bookingRoutes';

const router = Router();

router.use('/', masterRoutes);
router.use('/bookings', bookingRoutes);

export default router;