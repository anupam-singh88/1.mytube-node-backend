class ApiResponse {
    constructor({ statusCode, data = null, message = 'Success', metadata = null }) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode >= 200 && statusCode < 400;
        this.metadata = metadata;
    }

    static success(data, message = 'Success', metadata = null) {
        return new ApiResponse({ statusCode: 200, data, message, metadata });
    }

    static created(data, message = 'Resource created successfully', metadata = null) {
        return new ApiResponse({ statusCode: 201, data, message, metadata });
    }

    static error(statusCode, message, data = null, metadata = null) {
        return new ApiResponse({ statusCode, data, message, metadata });
    }
}

export default ApiResponse;
