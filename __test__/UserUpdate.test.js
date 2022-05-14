const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const tr = require('../locales/tr/translation.json');
const en = require('../locales/en/translation.json');
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
const putUser = async (id = 5, body = null, option = {}) => {
  let agent = request(app);
  let token = option.token;
  if (option.auth) {
    const response = await agent.post('/api/1.0/auth').send({ ...option.auth });
    token = response.body.token;
  }
  agent = request(app).put('/api/1.0/users/' + id);
  if (option.language) {
    agent.set('accept-language', option.language);
  }
  if (token) {
    agent.set('Authorization', `bearer ${token}`);
  }
  return agent.send(body);
};
const addUser = async (user = { ...activeUser }) => {
  const hashedPwd = await bcrypt.hash(user.password, 10);
  user.password = hashedPwd;
  return await User.create(user);
};

describe('User update', () => {
  it('returns forbidden when request sent without basic authentication', async () => {
    const response = await request(app).put('/api/1.0/users/5').send({
      username: '_usr1',
    });
    expect(response.status).toBe(403);
  });

  it.each`
    language | message
    ${'en'}  | ${en.unauthorized_user_update}
    ${'tr'}  | ${tr.unauthorized_user_update}
  `(
    'returns proper error body with $message when request sent without basic authentication and language set to $language',
    async ({ language, message }) => {
      const currentTimestamp = new Date().getTime();
      const response = await putUser(5, null, { language: language });
      expect(response.body.message).toBe(message);
      expect(response.body.timestamp).toBeGreaterThan(currentTimestamp);
      expect(response.body.path).toBe('/api/1.0/users/5');
    }
  );
  it('returns a forbidden when request sent with incorrect email in basic authentication', async () => {
    await addUser();
    const response = await putUser(5, null, {
      auth: { email: 'usr222@gmail.com', password: 'Password4' },
    });
    expect(response.status).toBe(403);
  });
  it('returns a forbidden when request sent with incorrect password in basic authentication', async () => {
    await addUser();
    const response = await putUser(5, null, {
      auth: { email: 'user1@gmail.com', password: 'Password' },
    });
    expect(response.status).toBe(403);
  });
  it('returns forbidden when update sent with correct credential but for different user', async () => {
    await addUser();
    const userToBeUpdate = await addUser({
      ...activeUser,
      username: 'user299',
      email: 'user299@gmail.com',
    });
    const response = await putUser(userToBeUpdate.id, null, {
      auth: { email: 'user1@gmail.com', password: 'Password4' },
    });
    expect(response.status).toBe(403);
  });
  it('returns forbidden when inactive user update itself with correct credentials ', async () => {
    const inactiveUser = await addUser({
      ...activeUser,
      inactive: true,
    });
    const response = await putUser(inactiveUser.id, null, {
      auth: { email: 'user1@gmail.com', password: 'Password4' },
    });
    expect(response.status).toBe(403);
  });
  it('returns 200 when valid update request sent with correct credentials', async () => {
    const savedUser = await addUser();
    const response = await putUser(
      savedUser.id,
      { username: 'user222' },
      {
        auth: { email: savedUser.email, password: 'Password4' },
      }
    );
    expect(response.status).toBe(200);
  });
  it('update username in database when valid update request sent with correct credentials', async () => {
    const savedUser = await addUser();
    const response = await putUser(
      savedUser.id,
      { username: 'user222' },
      {
        auth: { email: savedUser.email, password: 'Password4' },
      }
    );
    const user = await User.findOne({ where: { id: savedUser.id } });
    expect(user.username).toBe('user222');
  });
  it('returns 403 when token is not valid ', async () => {
    const response = await putUser(5, null, {
      token: '123',
    });
    expect(response.status).toBe(403);
  });
});
