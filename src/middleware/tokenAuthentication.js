const TokenService = require('../auth/tokenService');

const tokenAuthentication = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) return next();

  const token = authorization.substring(7);
  try {
    const user = await TokenService.verify(token);
    req.authenticatedUser = user;
  } catch (error) {}
  return next();
};

module.exports = tokenAuthentication;
