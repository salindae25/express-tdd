const nodemailer = require('nodemailer');
const config = require('config');

const emailConfig = config.get('email');

const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  auth: emailConfig.auth || null,
  tls: emailConfig.tls,
});

module.exports = transporter;
