const crypto = require('crypto');
const randomString = (length = 10) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

module.exports = { randomString };
