const errorHandler = (error, req, res, next) => {
  console.error("Error:", error);

  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,

    message:
      statusCode === 500
        ? "Internal server error."
        : error.message,

    ...(error.errors && {
      errors: error.errors,
    }),
  });
};

module.exports = {
  errorHandler,
};