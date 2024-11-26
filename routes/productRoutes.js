import express from 'express';
import { createProduct, deleteProduct, editProduct, getAllProducts, getProduct, incremeentProductView } from '../controllers/productController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import path from 'path';
import multer from 'multer';

const router = express.Router();

// Set up storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/products/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.route('/').get(getAllProducts)


router.route('/:id')
    .get(getProduct)


router.route('/:id/view')
    .put(incremeentProductView)

router.route('/admin').post(protect, authorize('admin'), upload.single('image'), createProduct);
router.route('/admin/:id').delete(protect, authorize('admin'), deleteProduct);
router.route('/admin/:id').patch(protect, authorize('admin'), upload.single('image'), editProduct);

export default router;