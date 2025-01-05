export default {
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    API_VERSION: process.env.API_VERSION || '/api/v1',
    STATIC_FILES_DIR: process.env.STATIC_FILES_DIR || 'public',
    MONGODB_URL: process.env.MONGODB_URL || "mongodb://localhost:27017",
    DB_NAME: process.env.DB_NAME || "defaultDB",
};
