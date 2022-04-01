const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');

describe('User Registration', () => {
  const postUserSignup = () =>
    request(app).post('/api/1.0/users').send({
      username: 'user1',
      email: 'user1@gmail.com',
      password: 'password',
    });
  beforeAll(() => {
    return sequelize.sync();
  });
  beforeEach(() => {
    return User.destroy({ truncate: true });
  });
  it('returns a 200 ok when signup request is valid', async () => {
    const response = await postUserSignup();
    expect(response.status).toBe(200);
  });

  it('returns a success message when signup request is valid', async () => {
    const response = await postUserSignup();
    expect(response.body.message).toBe('user created');
  });
  it('save the user to the database', async () => {
    const response = await postUserSignup();
    const allUsers = await User.findAll();
    expect(allUsers.length).toBe(1);
  });

  it('save the username and email to the database', async () => {
    const response = await postUserSignup();
    const allUsers = await User.findAll();
    const firstUser = allUsers[0];
    expect(firstUser.email).toBe('user1@gmail.com');
    expect(firstUser.username).toBe('user1');
  });

  it('save password in hash format to the database', async () => {
    const response = await postUserSignup();
    const allUsers = await User.findAll();
    const firstUser = allUsers[0];
    expect(firstUser.password).not.toBe('password');
  });
});
