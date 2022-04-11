const transporter = require('../config/emailTransporter');
const nodemailer = require('nodemailer');
const sendActivationToken = async (email, token) => {
  const url = await transporter.sendMail({
    from: 'My App<info@my-app.com>',
    to: email,
    subject: 'Account Activation',
    html: `<div>
            <p>Thank you for registering. </p>
            <p>please click following link to activate your account</p>
            <div>
              <a href='http://localhost:8080/#/login?token=${token}' >Activate</a>
            </div>
          </div>`,
  });
};

module.exports = { sendActivationToken };
