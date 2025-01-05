import mongoose from "mongoose";
import logger from "../utils/logger.js"; // Custom logger
import config from "../config/index.js"; // Centralized configuration

const connectToDB = async () => {
    const { MONGODB_URL, DB_NAME } = config;

    if (!MONGODB_URL || !DB_NAME) {
        logger.error("Missing database configuration: MONGODB_URL or DB_NAME is not defined.");
        throw new Error("Database connection failed due to missing configuration.");
    }

    try {
        const connectionInstance = await mongoose.connect(`${MONGODB_URL}/${DB_NAME}`);
        logger.info(`Database connected successfully. Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        logger.error(`Database connection failed: ${error.message}`);
        throw error; // Allow the caller to handle the error
    }
};

export default connectToDB;
