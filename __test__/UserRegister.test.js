const request = require('supertest');
const app = require('../src/app');

describe('User Registration', () => {
  const postUserSignup = () =>
    request(app).post('/api/1.0/users').send({
      username: 'user1',
      email: 'user1@gmail.com',
      password: 'Password',
    });

  it('returns a 200 ok when signup request is valid', async () => {
    const response = await postUserSignup();
    expect(response.status).toBe(200);
  });

  it('returns a success message when signup request is valid', async () => {
    const response = await postUserSignup();
    expect(response.body.message).toBe('user created');
  });
});
