// eslint-disable-next-line no-unused-vars
module.exports = function ErrorHandler(err, req, res, next) {
  const { status, message, errors } = err;
  let errorContent = {
    path: req.originalUrl,
    timestamp: new Date().getTime(),
    message: req.t(message),
  };
  if (errors) {
    errorContent = {
      ...errorContent,
      validationErrors: { ...errors },
    };
  }
  return res.status(status).send(errorContent);
};
