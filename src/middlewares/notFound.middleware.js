import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../utils/httpStatus.js";

// Middleware to handle not found routes
const notFoundHandler = (req, res, next) => {
    const error = new ApiError({
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: "Route not found"
    });

    next(error);
};

export default notFoundHandler;
