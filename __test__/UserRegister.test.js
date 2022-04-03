const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');

const validUser = {
  username: 'user1',
  email: 'user1@gmail.com',
  password: 'Password4',
};
const postUserSignup = (user = validUser) =>
  request(app).post('/api/1.0/users').send(user);

describe('User Registration', () => {
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

  it('return 400 when username is null ', async () => {
    const response = await postUserSignup({ ...validUser, username: null });
    expect(response.statusCode).toBe(400);
  });

  it('returns validationErrors field in response body when validation error occur', async () => {
    const response = await postUserSignup({ ...validUser, username: null });
    expect(response.body.validationErrors).not.toBeUndefined();
  });

  it('returns errors when both username and email are null', async () => {
    const response = await postUserSignup({
      ...validUser,
      email: null,
      username: null,
    });

    expect(Object.keys(response.body.validationErrors)).toEqual(
      expect.arrayContaining(['username', 'email'])
    );
  });

  it.each([
    { field: 'username', expected: 'Username cannot be null', value: null },
    {
      field: 'username',
      expected: 'Must have min 4 and max 32 characters',
      value: 'usr',
    },
    {
      field: 'username',
      expected: 'Must have min 4 and max 32 characters',
      value: 'a'.repeat(33),
    },
    { field: 'email', expected: 'E-mail cannot be null', value: null },
    { field: 'email', expected: 'E-mail is not valid', value: 'mail.com' },
    { field: 'email', expected: 'E-mail is not valid', value: 'user.mail.com' },
    { field: 'email', expected: 'E-mail is not valid', value: 'user.mail@com' },

    { field: 'password', expected: 'Password cannot be null', value: null },
    {
      field: 'password',
      expected: 'Password must be 6 characters long',
      value: 'ps4',
    },
    {
      field: 'password',
      expected:
        'Password must have at least 1 uppercase, 1 lowercase letter and 1 number',
      value: 'allowCase',
    },
    {
      field: 'password',
      expected:
        'Password must have at least 1 uppercase, 1 lowercase letter and 1 number',
      value: 'allowCa@se',
    },
  ])(
    'returns $expected when $field is $value',
    async ({ field, value, expected }) => {
      const user = { ...validUser };
      user[field] = value;
      const response = await postUserSignup(user);
      expect(response.body.validationErrors[field]).toBe(expected);
    }
  );

  it('returns E-mail in use when same email is already in use', async () => {
    await User.create({ ...validUser });
    const response = await postUserSignup();
    expect(response.body.validationErrors.email).toBe('E-mail in use');
  });
});
