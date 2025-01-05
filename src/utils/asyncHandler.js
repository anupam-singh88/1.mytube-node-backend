const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            await requestHandler(req, res, next);
        } catch (error) {
            next(error); // Pass the error to the centralized error handler
        }
    };
};

export default asyncHandler;
