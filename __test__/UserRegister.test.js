const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const SMTPServer = require('smtp-server').SMTPServer;

const validUser = {
  username: 'user1',
  email: 'user1@gmail.com',
  password: 'Password4',
};

const postUserSignup = (user = validUser, option = { translate: 'en' }) =>
  request(app).post('/api/1.0/users').set('accept-language', option.translate).send(user);

let lastMail, smtpServer;
let simulateSmtpFailure = false;
beforeAll(async () => {
  smtpServer = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
      let mailBody;
      stream.on('data', (data) => {
        mailBody += data.toString();
      });
      stream.on('end', () => {
        if (simulateSmtpFailure) {
          const err = new Error('Invalid mailbox');
          err.responseCode = 533;
          return callback(err);
        }
        lastMail = mailBody;
        callback();
      });
    },
  });

  await smtpServer.listen(8485, 'localhost');

  await sequelize.sync();
});

beforeEach(() => {
  simulateSmtpFailure = false;
  return User.destroy({ truncate: true });
});

afterAll(async () => {
  await smtpServer.close();
});
describe('User Registration', () => {
  it('returns a 200 ok when signup request is valid', async () => {
    const response = await postUserSignup();
    expect(response.status).toBe(200);
  });

  const user_created = 'User created';
  it('returns a success message when signup request is valid', async () => {
    const response = await postUserSignup();
    expect(response.body.message).toBe(user_created);
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

    expect(Object.keys(response.body.validationErrors)).toEqual(expect.arrayContaining(['username', 'email']));
  });

  const username_null = 'Username cannot be null';
  const username_length = 'Must have min 4 and max 32 characters';
  const email_null = 'E-mail cannot be null';
  const email_not_valid = 'E-mail is not valid';
  const password_null = 'Password cannot be null';
  const password_length = 'Password must be 6 characters long';
  const passwor_valid = 'Password must have at least 1 uppercase, 1 lowercase letter and 1 number';
  const email_inuse = 'E-mail in use';
  it.each([
    { field: 'username', expected: username_null, value: null },
    { field: 'username', expected: username_length, value: 'usr' },
    { field: 'username', expected: username_length, value: 'a'.repeat(33) },
    { field: 'email', expected: email_null, value: null },
    { field: 'email', expected: email_not_valid, value: 'mail.com' },
    { field: 'email', expected: email_not_valid, value: 'user.mail.com' },
    { field: 'email', expected: email_not_valid, value: 'user.mail@com' },
    { field: 'password', expected: password_null, value: null },
    { field: 'password', expected: password_length, value: 'ps4' },
    { field: 'password', expected: passwor_valid, value: 'allowCase' },
    { field: 'password', expected: passwor_valid, value: 'allowCa@se' },
  ])('returns $expected when $field is $value', async ({ field, value, expected }) => {
    const user = { ...validUser };
    user[field] = value;
    const response = await postUserSignup(user);
    expect(response.body.validationErrors[field]).toBe(expected);
  });

  it(`returns ${email_inuse} when same email is already in use`, async () => {
    await User.create({ ...validUser });
    const response = await postUserSignup();
    expect(response.body.validationErrors.email).toBe(email_inuse);
  });

  it('create user in inactive mode', async () => {
    await postUserSignup();
    const user = await User.findOne();
    expect(user.inactive).toBe(true);
  });

  it('create user in inactive mode even when request body containe inactive as false', async () => {
    await postUserSignup({ ...validUser, inactive: false });
    const user = await User.findOne();
    expect(user.inactive).toBe(true);
  });

  it('create a activationToken for valid user', async () => {
    await postUserSignup();
    const user = await User.findOne();
    expect(user.activationToken).toBeTruthy();
  });

  it('recive a email containing activationToken', async () => {
    await postUserSignup();
    const user = await User.findOne();
    expect(lastMail).toContain(validUser.email);
    expect(lastMail).toContain(user.activationToken);
  });

  it('return 502 Bad Gateway when sending email(activation) fail', async () => {
    simulateSmtpFailure = true;
    const response = await postUserSignup();
    expect(response.status).toBe(502);
  });

  it('return E-mail failure message when sending email(activation) fail', async () => {
    simulateSmtpFailure = true;
    const response = await postUserSignup();
    expect(response.body.message).toBe('E-mail failure');
  });

  it('does not save user when sending email(activation) fail', async () => {
    simulateSmtpFailure = true;
    const response = await postUserSignup();
    const users = await User.findAll();
    expect(users.length).toBe(0);
  });

  describe('Intenationalization-en1', () => {
    const user_created = 'User created1';
    const username_null = 'Username cannot be null1';
    const username_length = 'Must have min 4 and max 32 characters1';
    const email_null = 'E-mail cannot be null1';
    const email_not_valid = 'E-mail is not valid1';
    const password_null = 'Password cannot be null1';
    const password_length = 'Password must be 6 characters long1';
    const passwor_valid = 'Password must have at least 1 uppercase, 1 lowercase letter and 1 number1';
    const email_inuse = 'E-mail in use1';
    const email_failure = 'E-mail failure1';
    it('returns a success message when signup request is valid', async () => {
      const response = await postUserSignup(validUser, { translate: 'tr' });
      expect(response.body.message).toBe(user_created);
    });

    it.each([
      { field: 'username', expected: username_null, value: null },
      { field: 'username', expected: username_length, value: 'usr' },
      { field: 'username', expected: username_length, value: 'a'.repeat(33) },
      { field: 'email', expected: email_null, value: null },
      { field: 'email', expected: email_not_valid, value: 'mail.com' },
      { field: 'email', expected: email_not_valid, value: 'user.mail.com' },
      { field: 'email', expected: email_not_valid, value: 'user.mail@com' },
      { field: 'password', expected: password_null, value: null },
      { field: 'password', expected: password_length, value: 'ps4' },
      { field: 'password', expected: passwor_valid, value: 'allowCase' },
      { field: 'password', expected: passwor_valid, value: 'allowCa@se' },
    ])('returns $expected when $field is $value', async ({ field, value, expected }) => {
      const user = { ...validUser };
      user[field] = value;
      const response = await postUserSignup(user, { translate: 'tr' });
      expect(response.body.validationErrors[field]).toBe(expected);
    });

    it(`returns ${email_inuse} when same email is already in use`, async () => {
      await User.create({ ...validUser });
      const response = await postUserSignup(validUser, { translate: 'tr' });
      expect(response.body.validationErrors.email).toBe(email_inuse);
    });
    it(`return ${email_failure} message when sending email(activation) fail`, async () => {
      simulateSmtpFailure = true;
      const response = await postUserSignup(validUser, { translate: 'tr' });
      expect(response.body.message).toBe(email_failure);
    });
  });
});
describe('User Activation', () => {
  it('activate the user when correct token is send', async () => {
    await postUserSignup();
    let user = await User.findOne();
    const token = user.activationToken;
    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    user = await User.findOne();
    expect(user.inactive).toBe(false);
  });

  it('removes the activationToken once user activated', async () => {
    await postUserSignup();
    let user = await User.findOne();
    const token = user.activationToken;
    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    user = await User.findOne();
    expect(user.activationToken).toBeFalsy();
  });

  it('does not activate user when the  sent token is incorrect', async () => {
    await postUserSignup();
    let user = await User.findOne();
    const token = 'this-token-does-not-exist';
    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    user = await User.findOne();
    expect(user.inactive).toBe(true);
  });
  it('return 400 bad request when the sent token is incorrect', async () => {
    await postUserSignup();
    const token = 'this-token-does-not-exist';
    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    expect(response.status).toBe(400);
  });

  it.each`
    language | tokenStatus  | message
    ${'tr'}  | ${'wrong'}   | ${'This account is either active or token is invalid1'}
    ${'en'}  | ${'wrong'}   | ${'This account is either active or token is invalid'}
    ${'tr'}  | ${'correct'} | ${'This account is activated1'}
    ${'en'}  | ${'correct'} | ${'This account is activated'}
  `(
    'returns $message when the sent token is $tokenStatus and language is $language',
    async ({ language, tokenStatus, message }) => {
      await postUserSignup();
      let user = await User.findOne();
      let token = user.activationToken;
      if (tokenStatus == 'wrong') token = 'this-token-does-not-exist';
      const response = await request(app)
        .post('/api/1.0/users/token/' + token)
        .set('accept-language', language)
        .send();

      expect(response.body.message).toBe(message);
    }
  );
});
