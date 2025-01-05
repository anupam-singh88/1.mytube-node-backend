class ApiError extends Error {
    constructor({
        statusCode,
        message = 'Something went wrong',
        errors = [],
        stack,
        data = null,
        success = false,
        metadata = {},
    }) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.data = data;
        this.success = success;
        this.metadata = metadata;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    static badRequest(message = 'Bad Request', errors = []) {
        return new ApiError({ statusCode: 400, message, errors });
    }

    static notFound(message = 'Resource not found', errors = []) {
        return new ApiError({ statusCode: 404, message, errors });
    }

    static internal(message = 'Internal Server Error', errors = []) {
        return new ApiError({ statusCode: 500, message, errors });
    }
}

export default ApiError;