import dotenv from 'dotenv';
import connectToDB from './db/dbConnect.js';
import app from './app.js';
import logger from './utils/logger.js';
import config from './config/index.js';
dotenv.config({ path: './.env' });

const startServer = async () => {
    try {
        await connectToDB();

        const PORT = config.PORT || 8000;
        const server = app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });

        process.on('SIGTERM', () => {
            logger.info('SIGTERM received. Shutting down gracefully...');
            server.close(() => {
                logger.info('Server closed.');
                process.exit(0);
            });
        });
    } catch (error) {
        logger.error('Server startup failed:', error);
        process.exit(1);
    }
};

startServer();
