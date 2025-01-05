import JWT from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { User } from '../models/user.model.js';

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // Extract token from either cookies or Authorization header
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!accessToken) {
            throw new ApiError(401, "Access token is missing");
        }

        // Verify the JWT token
        let decodedToken;
        try {
            decodedToken = JWT.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        } catch (error) {
            // Handle specific JWT errors
            if (error.name === "TokenExpiredError") {
                throw new ApiError(401, "Access token has expired");
            }
            if (error.name === "JsonWebTokenError") {
                throw new ApiError(401, "Invalid access token");
            }
            throw error; // Rethrow unknown errors
        }

        // Retrieve the user associated with the token
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "User not found for the provided access token");
        }

        // Optionally check if the user is active
        // if (!user.isActive) {
        //     throw new ApiError(401, "User account is deactivated");
        // }

        req.user = user;
        next();
    } catch (error) {
        // If it's a custom ApiError, use its status code, else default to 401
        throw new ApiError(error.statusCode || 401, error?.message || "Unauthorized access");
    }
});