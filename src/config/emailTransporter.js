const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 8485,
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;
