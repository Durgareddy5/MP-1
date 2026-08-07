const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

const sendError = (res, error, message = 'Error', statusCode = 400) => {
  res.status(statusCode).json({
    success: false,
    message,
    error: error.message || error,
    timestamp: new Date().toISOString(),
  });
};

const sendPaginatedResponse = (res, data, pagination, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit),
    },
    timestamp: new Date().toISOString(),
  });
};

export {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
};
