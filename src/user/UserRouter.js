const express = require('express');
const UserService = require('./UserService');
const { userSignupScheme, validate } = require('./UserValidator');
const router = express.Router();

router.post('/api/1.0/users', validate(userSignupScheme), async (req, res) => {
  try {
    await UserService.create(req.body);
    return res.send({ message: 'user created' });
  } catch (ex) {
    return res
      .status(400)
      .send({ validationErrors: { email: 'E-mail is use' } });
  }
});

module.exports = router;
