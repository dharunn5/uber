const nodemailer = require('nodemailer');

const {
  MAIL_HOST,
  MAIL_PORT,
  MAIL_SECURE,
  MAIL_USER,
  MAIL_PASSWORD,
  MAIL_FROM
} = process.env;

if (!MAIL_HOST || !MAIL_PORT || !MAIL_USER || !MAIL_PASSWORD || !MAIL_FROM) {
  console.warn('Mail configuration is incomplete. Please set MAIL_* environment variables.');
}

const transport = nodemailer.createTransport({
  host: MAIL_HOST,
  port: Number(MAIL_PORT || 587),
  secure: MAIL_SECURE === 'true',
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASSWORD,
  },
});

const defaultFrom = MAIL_FROM || 'no-reply@example.com';

module.exports = {
  transport,
  sendMail: async (options) => {
    const mailOptions = {
      from: defaultFrom,
      ...options,
    };
    return transport.sendMail(mailOptions);
  },
};
