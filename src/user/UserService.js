const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('./User');
const EmailService = require('../email/EmailService');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const EmailException = require('../email/EmailException');
const InvalidTokenException = require('./InvalidTokenException');
const UserNotFoundException = require('./UserNotFoundException');
const { randomString } = require('../shared/generator');

const create = async (data) => {
  const { username, password, email } = data;

  const hashedPwd = await bcrypt.hash(password, 10);
  const newUser = {
    username,
    email,
    password: hashedPwd,
    activationToken: randomString(16),
  };
  const transaction = await sequelize.transaction();
  await User.create(newUser, { transaction: transaction });
  try {
    await EmailService.sendActivationToken(email, newUser.activationToken);
    transaction.commit();
  } catch (err) {
    transaction.rollback();
    throw new EmailException();
  }
};

const activate = async (token) => {
  const user = await User.findOne({ where: { activationToken: token } });
  if (!user) {
    throw new InvalidTokenException();
    return 0;
  }
  user.inactive = false;
  user.activationToken = null;
  await user.save();
};

const findByEmail = (email) => {
  return User.findOne({ where: { email } });
};

const getUsers = async (page = 0, size = 10, authenticatedUser = null) => {
  const userId = authenticatedUser ? authenticatedUser.id : 0;
  const pageSize = size;
  const usersWithCount = await User.findAndCountAll({
    limit: pageSize,
    offset: page * pageSize,
    where: {
      inactive: false,
      id: {
        [Sequelize.Op.not]: userId,
      },
    },
    attributes: ['id', 'username', 'email'],
  });

  return {
    content: usersWithCount.rows,
    page: page,
    size: pageSize,
    totalPages: Math.ceil(usersWithCount.count / pageSize),
  };
};

const getUser = async (id) => {
  const user = await User.findOne({
    where: { id: id, inactive: false },
    attributes: ['id', 'username', 'email'],
  });
  if (!user) throw new UserNotFoundException();
  return user;
};

const updateUser = async (id, updateBody) => {
  const user = await User.findOne({ where: { id: id } });
  user.username = updateBody.username;
  user.save();
  return user;
};

module.exports = {
  create,
  activate,
  getUsers,
  getUser,
  findByEmail,
  updateUser,
};
