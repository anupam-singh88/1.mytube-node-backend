import ApiResponse from "../utils/ApiResposne.js";
import { HTTP_STATUS } from "../utils/httpStatus.js";

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error("Global Error: ", err);  // Log the error details (can be improved with a logging package)

    const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = err.message || "Internal Server Error";

    return res.status(statusCode).json(
        new ApiResponse(statusCode, null, message)
    );
};

export default errorHandler;
