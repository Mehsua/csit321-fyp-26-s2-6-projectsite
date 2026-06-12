const errorLogService = require('../services/ErrorLogService');

function errorHandler(err, req, res, next) {
  console.error(err.stack);
  const status = err.status || 500;

  if (status >= 500) {
    errorLogService.logError({
      userId: req.user?.user_id ?? null,
      errorType: 'API',
      message: err.message || 'Internal server error',
      endpoint: `${req.method} ${req.path}`,
    }).catch(() => {});
  }

  res.status(status).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}

module.exports = errorHandler;
