import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { errorHandler } from './core/error-handler.js';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api/v1', routes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rescom API is running' });
});

// Global Error Handler must be the last middleware
app.use(errorHandler);

export default app;
