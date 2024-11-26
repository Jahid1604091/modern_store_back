import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { errHandler, notFound } from './middleware/errorHandler.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import path from 'path';

const __dirname = path.resolve()
dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();
connectDB();
app.use(cors({
  // credentials: true,
  // origin: [process.env.DEV_DOMAIN, process.env.LIVE_DOMAIN, process.env.DEV_ADMIN, process.env.LIVE_ADMIN],
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type','*'],
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/invoices', express.static(path.join(__dirname, './invoices')));
app.use('/images/*', express.static(path.join(__dirname, './images')));
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);

if (process.env.NODE_ENV === 'prod') {
  app.use(express.static(path.join(__dirname, '../frontend/build'))); // Adjust path here
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'build', 'index.html')); // Adjust path here
  });
}

else {
  app.get('', (req, res) => {
    res.send('Server is up...')
  });
}


app.use(notFound);
app.use(errHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));