const { randomString } = require('../shared/generator');
const Token = require('./Token');

const createToken = async (user) => {
  const token = randomString(32);
  await Token.create({ token: token, userId: user.id });
  return token;
};
const verify = async (token) => {
  const tokenInDb = await Token.findOne({ where: { token } });
  return tokenInDb ? { id: tokenInDb.userId } : null;
};
const remove = async (token) => {
  await Token.destroy({ where: { token } });
};
module.exports = { createToken, verify, remove };
