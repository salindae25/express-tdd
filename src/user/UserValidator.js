const { body, validationResult } = require('express-validator');
const User = require('./User');

const userSignupScheme = [
  body('username')
    .notEmpty()
    .withMessage('Username cannot be null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('Must have min 4 and max 32 characters'),
  body('email')
    .notEmpty()
    .withMessage('E-mail cannot be null')
    .bail()
    .isEmail()
    .withMessage('E-mail is not valid')
    .bail()
    .custom(async (email) => {
      const user = await User.findOne({ where: { email: email } });
      if (user) throw new Error('E-mail in use');
    }),
  ,
  body('password')
    .notEmpty()
    .withMessage('Password cannot be null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be 6 characters long')
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage(
      'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'
    ),
];

const validate = (schemas) => {
  return async (req, res, next) => {
    await Promise.all(schemas.map((schema) => schema.run(req)));

    const result = validationResult(req);
    if (result.isEmpty()) {
      return next();
    }

    const validationErrors = {};
    result.array().forEach((err) => {
      validationErrors[err.param] = err.msg;
    });
    return res.status(400).send({ validationErrors });
  };
};

module.exports = {
  userSignupScheme,
  validate,
};
