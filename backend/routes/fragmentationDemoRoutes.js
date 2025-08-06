import express from 'express';
import { 
    executeHorizontalDemo, 
    executeVerticalDemo 
} from '../controllers/fragmentationDemoController.js';

const router = express.Router();

// Endpoint para ejecutar la demostración de fragmentación horizontal
router.post('/horizontal-demo/:nodeSource', executeHorizontalDemo);

// Endpoint para ejecutar la demostración de fragmentación vertical
router.post('/vertical-demo/:nodeName', executeVerticalDemo);

export default router;
