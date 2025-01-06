import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';

import errorHandler from './middlewares/errorHandler.middleware.js';
import notFoundHandler from './middlewares/notFound.middleware.js';

// Import routes
import healthCheckRouter from './routes/healthcheck.routes.js';
import userRouter from './routes/user.routes.js';
import SubscriptionRouter from './routes/subscription.routes.js';
import tweetRouter from './routes/tweet.routes.js';
import videoRouter from './routes/video.routes.js';
import likeRouter from "./routes/like.routes.js";
import commentRouter from "./routes/comment.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

const app = express();

// Middlewares
app.use(helmet());
app.use(
    cors({
        origin: config.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true
    })
);
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));
app.use(express.static(config.STATIC_FILES_DIR || 'public'));
app.use(cookieParser());
app.use(morgan('dev'));

// Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// API Versioning
const apiVersion = config.API_VERSION || '/api/v1';

// Routes Declaration
app.use(`${apiVersion}/healthcheck`, healthCheckRouter);
app.use(`${apiVersion}/user`, userRouter);
app.use(`${apiVersion}/subscriptions`, SubscriptionRouter);
app.use(`${apiVersion}/tweet`, tweetRouter);
app.use(`${apiVersion}/video`, videoRouter);
app.use(`${apiVersion}/likes`, likeRouter);
app.use(`${apiVersion}/comment`, commentRouter);
app.use(`${apiVersion}/playlist`, playlistRouter);
app.use(`${apiVersion}/dashboard`, dashboardRouter);

// Middleware to handle undefined routes(404)
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
