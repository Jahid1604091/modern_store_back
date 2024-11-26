import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import { createCategory, deleteCategory, editCategory, getCategories } from '../controllers/categoryController.js';


router.route('/admin').post(protect, authorize('admin'), createCategory);
router.route('/admin/:id').delete(protect, authorize('admin'), deleteCategory);
router.route('/admin/:id').patch(protect, authorize('admin'), editCategory);

router.route('/').get(getCategories);

export default router