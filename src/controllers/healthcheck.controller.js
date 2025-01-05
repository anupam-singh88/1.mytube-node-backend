
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResposne.js";
import { HTTP_STATUS } from "../utils/httpStatus.js";

export const healthCheckController = asyncHandler(async (req, res) => {
    const message = "Server is up and running";
    return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, null, message));
});
