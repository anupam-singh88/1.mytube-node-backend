import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResposne.js";
import { HTTP_STATUS } from "../utils/httpStatus.js";
import logger from "../utils/logger.js";

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    logger.error("Global Error: ", err);

    const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = err.message || "Internal Server Error";

    return res.status(statusCode).json(
        new ApiError({
            statusCode,
            message,
        })
    );
};

export default errorHandler;
