export default {
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    API_VERSION: process.env.API_VERSION || '/api/v1',
    STATIC_FILES_DIR: process.env.STATIC_FILES_DIR || 'public',
    MONGODB_URL: process.env.MONGODB_URL || "mongodb://localhost:27017",
    DB_NAME: process.env.DB_NAME || "defaultDB",
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '1h',
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    PORT: process.env.PORT,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};
