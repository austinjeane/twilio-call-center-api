const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const twilio = require('twilio');

const client = twilio(accountSid, authToken);

const twiml = require('twilio').twiml;

exports.client = client;
exports.twiml = twiml;