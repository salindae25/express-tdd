const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(() => {
  simulateSmtpFailure = false;
  return User.destroy({ truncate: true });
});
const getUsers = () => {
  return request(app).get('/api/1.0/users').send();
};
const getUser = (id) => {
  return request(app)
    .get('/api/1.0/users/' + id)
    .send();
};
const addUsers = async (activeUserCount = 10, inactiveUserCount = 0) => {
  for (let i = 0; i < activeUserCount + inactiveUserCount; i++) {
    await User.create({
      username: `user${i}`,
      email: `user${i}@gmail.com`,
      password: 'Password4',
      inactive: inactiveUserCount > i,
    });
  }
};

describe('User Listing', () => {
  it('returns a 200 ok status when user listing request is valid', async () => {
    const response = await getUsers();
    expect(response.statusCode).toBe(200);
  });

  it('returns a page object as response body', async () => {
    const response = await getUsers();
    expect(response.body).toEqual({
      content: [],
      page: 0,
      size: 10,
      totalPages: 0,
    });
  });

  it('returns 10 users when there is 11 users in database', async () => {
    await addUsers(11, 0);
    const response = await getUsers();
    expect(response.body.content.length).toBe(10);
  });

  it('returns 6 users when there is 6 active users and 5 inactive users', async () => {
    await addUsers(6, 5);
    const response = await getUsers();
    expect(response.body.content.length).toBe(6);
  });
  it('returns only id,username and email in content array for each user', async () => {
    await addUsers(6, 5);
    const response = await getUsers();
    expect(Object.keys(response.body.content[0])).toEqual([
      'id',
      'username',
      'email',
    ]);
  });

  it('returns 2 totalPages when 15 active an 7 inactive users in the database ', async () => {
    await addUsers(15, 7);
    const response = await getUsers();
    expect(response.body.totalPages).toBe(2);
  });
  it('returns second page users and indicators when page is set to 1 at request param', async () => {
    await addUsers(11);
    const response = await request(app)
      .get('/api/1.0/users')
      .query({ page: 1 })
      .send();
    expect(response.body.content[0].username).toBe('user10');
    expect(response.body.page).toBe(1);
  });

  it('returns first page users  when page is set to less than or equal 0 at request param', async () => {
    await addUsers(11);
    const response = await request(app)
      .get('/api/1.0/users')
      .query({ page: -5 })
      .send();
    expect(response.body.content.length).toBe(10);
    expect(response.body.page).toBe(0);
  });

  it('returns 5 users and corresponding values when size is set to 5 in request parameter', async () => {
    await addUsers(11);
    const response = await request(app)
      .get('/api/1.0/users')
      .query({ size: 5 })
      .send();
    expect(response.body.content.length).toBe(5);
    expect(response.body.size).toBe(5);
  });
  it('returns 10 users and corresponding size indicator when size set to 1000', async () => {
    await addUsers(11);
    const response = await request(app)
      .get('/api/1.0/users')
      .query({ size: 1000 })
      .send();
    expect(response.body.content.length).toBe(10);
    expect(response.body.size).toBe(10);
  });

  it('returns 10 users and corresponding size indicator when size set to -5', async () => {
    await addUsers(11);
    const response = await request(app)
      .get('/api/1.0/users')
      .query({ size: -5 })
      .send();
    expect(response.body.content.length).toBe(10);
    expect(response.body.size).toBe(10);
  });

  it('return page as zero and size as 10 when non-numeric values are set to both size and page', async () => {
    await addUsers(11);
    const response = await request(app)
      .get('/api/1.0/users')
      .query({ size: 'qqq', page: 'size' })
      .send();
    expect(response.body.page).toBe(0);
    expect(response.body.size).toBe(10);
  });
});

describe('Get User', () => {
  it('return 404 not found error when user not found', async () => {
    const response = await request(app).get('/api/1.0/users/5').send();
    expect(response.status).toBe(404);
  });

  it.each`
    language | message
    ${'tr'}  | ${'User not found1'}
    ${'en'}  | ${'User not found'}
  `(
    'returns $message when user not found and language set to $language',
    async ({ language, message }) => {
      const response = await request(app)
        .get('/api/1.0/users/5')
        .set('accept-language', language)
        .send();
      expect(response.body.message).toBe(message);
    }
  );
  it('return a proper error body whe user not found', async () => {
    const currentTimeStamp = new Date().getTime();
    const next5SecondTimeStamp = currentTimeStamp + 5 * 1000;
    const response = await getUser(5);

    expect(response.body.path).toBe('/api/1.0/users/5');
    expect(response.body.timestamp)
      // .toBeGreaterThan(currentTimeStamp)
      .toBeLessThan(next5SecondTimeStamp);
    expect(Object.keys(response.body)).toEqual([
      'path',
      'timestamp',
      'message',
    ]);
  });
  it('returns 200 ok when active user exist', async () => {
    const user = await User.create({
      username: 'usr1',
      email: 'usr1@gmail.com',
      inactive: false,
    });
    const response = await getUser(user.id);

    expect(response.status).toBe(200);
  });
  it('return id, username and email when active user exist', async () => {
    const user = await User.create({
      username: 'usr1',
      email: 'usr1@gmail.com',
      inactive: false,
    });
    const response = await getUser(user.id);

    expect(Object.keys(response.body)).toEqual(['id', 'username', 'email']);
  });
  it('return 404 when user is inactive', async () => {
    const user = await User.create({
      username: 'usr1',
      email: 'usr1@gmail.com',
      inactive: true,
    });
    const response = await getUser(user.id);

    expect(response.status).toBe(404);
  });
});
