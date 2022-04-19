const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const bcrypt = require('bcrypt');
beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true });
});
const activeUser = {
  username: 'user1',
  email: 'user1@gmail.com',
  password: 'Password4',
  inactive: false,
};
const addUser = async (user = { ...activeUser }) => {
  const hashedPwd = await bcrypt.hash(user.password, 10);
  user.password = hashedPwd;
  return await User.create(user);
};
const authenticateUser = (credentials, option = { translate: 'en' }) => {
  return request(app)
    .post('/api/1.0/auth')
    .set('accept-language', option.translate)
    .send(credentials);
};
describe('Authenticate user', () => {
  fit('returns 200 ok when credentials are correct', async () => {
    await addUser();
    const response = await authenticateUser({
      email: 'user1@gmail.com',
      password: 'Password4',
    });
    expect(response.status).toBe(200);
  });

  fit('return user id and username and email when user login success', async () => {
    const user = await addUser();
    const response = await authenticateUser({
      email: 'user1@gmail.com',
      password: 'Password4',
    });
    expect(response.body.id).toBe(user.id);
    expect(response.body.username).toBe(user.username);
    expect(Object.keys(response.body)).toEqual(['id', 'username']);
  });
  fit('returns 401 when user does not exist', async () => {
    const response = await authenticateUser({
      email: 'user1@gmail.com',
      password: 'Password4',
    });
    expect(response.status).toBe(401);
  });
  fit('returns proper error body  when user does not exist', async () => {
    const nowInMillisecond = new Date().getTime();
    const response = await authenticateUser({
      email: 'user1@gmail.com',
      password: 'Password4',
    });
    expect(Object.keys(response.body)).toEqual([
      'path',
      'timestamp',
      'message',
    ]);
    expect(response.body.path).toBe('/api/1.0/auth');
    expect(response.body.timestamp).toBeGreaterThan(nowInMillisecond);
  });
  fit.each`
    language | message
    ${'tr'}  | ${'Incorrect credentials1'}
    ${'en'}  | ${'Incorrect credentials'}
  `(
    'returns $message when authentication failed and language set to $language',
    async ({ language, message }) => {
      const response = await authenticateUser(
        {
          email: 'user1@gmail.com',
          password: 'Password4',
        },
        { translate: language }
      );
      expect(response.body.message).toBe(message);
    }
  );

  fit('returns 401 when password is wrong', async () => {
    const user = await addUser();
    const response = await authenticateUser({
      email: 'user1@gmail.com',
      password: 'Password',
    });
    expect(response.status).toBe(401);
  });

  fit('returns 403 when logging in with inactive user', async () => {
    const user = await addUser({ ...activeUser, inactive: true });
    const response = await authenticateUser({
      email: 'user1@gmail.com',
      password: 'Password4',
    });
    expect(response.status).toBe(403);
  });
  fit('returns proper error body  when authentication failed with inactive user', async () => {
    const nowInMillisecond = new Date().getTime();
    const response = await authenticateUser({
      email: 'user1@gmail.com',
      password: 'Password4',
    });
    expect(Object.keys(response.body)).toEqual([
      'path',
      'timestamp',
      'message',
    ]);
    expect(response.body.path).toBe('/api/1.0/auth');
    expect(response.body.timestamp).toBeGreaterThan(nowInMillisecond);
  });
  fit.each`
    language | message
    ${'tr'}  | ${'Account is inactive1'}
    ${'en'}  | ${'Account is inactive'}
  `(
    'returns $message when authentication failed with inactive account and language set to $language',
    async ({ language, message }) => {
      const user = await addUser({ ...activeUser, inactive: true });
      const response = await authenticateUser(
        {
          email: 'user1@gmail.com',
          password: 'Password4',
        },
        { translate: language }
      );
      expect(response.body.message).toBe(message);
    }
  );
  fit('returns 401 when email is not valid', async () => {
    await addUser();
    const response = await authenticateUser({
      password: 'Password4',
    });
    expect(response.status).toBe(401);
  });
  fit('returns 401 when password is not valid', async () => {
    await addUser();
    const response = await authenticateUser({
      email: 'user1@gmai.com',
    });
    expect(response.status).toBe(401);
  });
});
