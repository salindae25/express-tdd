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
describe('User update', () => {
  fit('returns forbidden when request sent without basic authentication', async () => {
    const response = await request(app).put('/api/1.0/users/5').send({
      username: '_usr1',
    });
    expect(response.status).toBe(403);
  });
  fit.each`
    language | message
    ${'en'}  | ${en.unauthorized_user_update}
    ${'tr'}  | ${tr.unauthorized_user_update}
  `(
    'returns proper error body with $message when request sent without basic authentication and language set to $language',
    async ({ language, message }) => {
      const currentTimestamp = new Date().getTime();
      const response = await request(app)
        .put('/api/1.0/users/5')
        .set('accept-language', language)
        .send();
      expect(response.body.message).toBe(message);
      expect(response.body.timestamp).toBeGreaterThan(currentTimestamp);
      expect(response.body.path).toBe('/api/1.0/users/5');
    }
  );
});
