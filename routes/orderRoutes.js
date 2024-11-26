import express from 'express';
const router = express.Router();
import { createOrder, getAllOrders, getMyOrders, getMyOrder, updateOrderToPaid, generateInvoice } from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

router.route('/').post(protect, createOrder)
    .get(protect, authorize('admin'), getAllOrders)

router.route('/myorders').get(protect, getMyOrders)
router.route('/myorders/:id').get(protect, getMyOrder)
router.route('/myorders/:id/pay').put(protect, updateOrderToPaid)
router.route('/myorders/:id/invoice').get(protect, generateInvoice)

export default router