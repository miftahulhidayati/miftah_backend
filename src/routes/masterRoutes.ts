import { Router } from 'express';
import { MasterController } from '../controllers/masterController';

const router = Router();

router.get('/units', MasterController.getUnits);
router.get('/rooms', MasterController.getRooms);
router.get('/consumptions', MasterController.getConsumptions);

export default router;