const express = require('express');
const UserService = require('./UserService');
const router = express.Router();

router.post('/api/1.0/users', async (req, res) => {
  const dbAction = await UserService.create(req.body);
  return res.send({ message: 'user created' });
});

module.exports = router;
