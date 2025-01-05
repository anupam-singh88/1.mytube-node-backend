import ApiResponse from "../utils/ApiResposne.js";
import { HTTP_STATUS } from "../utils/httpStatus.js";

// Middleware to handle not found routes
const notFoundHandler = (req, res, next) => {
    return res.status(HTTP_STATUS.NOT_FOUND).json(
        new ApiResponse(HTTP_STATUS.NOT_FOUND, null, "Route not found")
    );
};

export default notFoundHandler;
