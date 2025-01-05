import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import Logger from "../utils/logger.js"; // Assuming a logger instance
import config from "../config/index.js";

cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
});

if (
    !config.CLOUDINARY_CLOUD_NAME ||
    !config.CLOUDINARY_API_KEY ||
    !config.CLOUDINARY_API_SECRET
) {
    throw new Error("Cloudinary configuration is missing in environment variables.");
}

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) {
        Logger.error("Local file path is required.");
        throw new Error("Local file path is missing.");
    }

    try {
        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // Logger.info(`File uploaded to Cloudinary: ${result.url}`);
        await fs.unlink(localFilePath); // Remove file from local storage
        return result;
    } catch (error) {
        Logger.error("Cloudinary upload failed:", error.message);
        await safeDelete(localFilePath); // Safely delete the file if an error occurs
        throw new Error("Cloudinary upload failed. Please try again.");
    }
};

const deleteOnCloudinary = async (public_id, resource_type = "image") => {
    if (!public_id) {
        Logger.error("Public ID is required for deletion.");
        throw new Error("Public ID is missing.");
    }

    try {
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type,
        });

        Logger.info(`File deleted from Cloudinary: ${public_id}`);
        return result;
    } catch (error) {
        Logger.error("Cloudinary deletion failed:", error.message);
        throw new Error("Cloudinary deletion failed. Please try again.");
    }
};

// Utility to handle safe file deletion
const safeDelete = async (filePath) => {
    try {
        await fs.unlink(filePath);
        Logger.info(`Local file deleted: ${filePath}`);
    } catch (error) {
        Logger.warn(`Failed to delete local file: ${filePath}`, error.message);
    }
};

export { uploadOnCloudinary, deleteOnCloudinary };
