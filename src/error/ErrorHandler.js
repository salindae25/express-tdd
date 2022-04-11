// eslint-disable-next-line no-unused-vars
module.exports = function ErrorHandler(err, req, res, next) {
  const { status, message, errors } = err;
  let validationErrors = null;
  if (errors) validationErrors = { ...errors };

  return res
    .status(status)
    .send({ path: req.originalUrl, timestamp: new Date().getTime(), message: req.t(message), validationErrors });
};
