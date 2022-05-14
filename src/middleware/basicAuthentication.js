const bcrypt = require('bcrypt');
const UserService = require('../user/UserService');

const basicAuthentication = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) return next();

  const encoded = authorization.substring(6);
  const decoded = Buffer.from(encoded, 'base64').toString('ascii');
  const [email, password] = decoded.split(':');
  const user = await UserService.findByEmail(email);
  if (!(user && !user.inactive)) return next();

  const match = await bcrypt.compare(password, user.password);
  if (!match) return next();
  req.authenticatedUser = user;
  return next();
};
module.exports = basicAuthentication;
