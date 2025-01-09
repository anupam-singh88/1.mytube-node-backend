import jwt from 'jsonwebtoken'; // Consistent naming convention
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import config from '../config/index.js';

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!accessToken) {
            throw new ApiError({ statusCode: 401, message: "Access token is missing" });
        }


        let decodedToken;
        try {
            decodedToken = jwt.verify(accessToken, config.ACCESS_TOKEN_SECRET);
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                throw new ApiError({ statusCode: 401, message: "Access token has expired" });
            }
            if (error.name === "JsonWebTokenError") {
                throw new ApiError({ statusCode: 401, message: "Invalid access token" });
            }
            throw new ApiError({ statusCode: 500, message: "Error verifying token" });
        }

        if (!decodedToken?._id) {
            throw new ApiError({ statusCode: 401, message: "Invalid token payload" });
        }

        const user = await User.findById(decodedToken._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError({ statusCode: 401, message: "User not found for the provided access token" });
        }

        req.user = user; 
        next();
    } catch (error) {
        console.error("JWT verification error:", error);

        throw new ApiError({ statusCode: error.statusCode || 401, message: error?.message || "Unauthorized access" });
    }
});

// Middleware to authorize specific permissions
export const authorizePermissions = (...requiredPermissions) => {
    return asyncHandler(async (req, res, next) => {
        try {
            if (!req.user) {
                throw new ApiError({ statusCode: 401, message: "Unauthorized access" });
            }


            const userPermissions = req.user.permissions || [];
            const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));

            if (!hasPermission) {
                throw new ApiError({ statusCode: 403, message: "You do not have the required permissions" });
            }

            next();
        } catch (error) {
            console.error("Authorization error:", error);
            throw new ApiError({ statusCode: error.statusCode || 403, message: error?.message || "Forbidden access" });
        }
    });
};
