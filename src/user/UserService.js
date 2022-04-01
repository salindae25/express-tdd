const bcrypt = require('bcrypt');
const User = require('./User');

const UserService = {
  create: async (data) => {
    const hashedPwd = await bcrypt.hash(data.password, 10);
    const newUser = { ...data, password: hashedPwd };
    return User.create(newUser);
  },
};
module.exports = UserService;
