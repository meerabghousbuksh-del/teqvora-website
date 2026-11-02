// Express 4 does not catch rejected promises from async route handlers.
// This wrapper forwards them to the error-handling middleware.
module.exports = function asyncHandler(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
};
