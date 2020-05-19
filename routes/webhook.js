var express = require('express');
var router = express.Router();

var twilioHelper = require('./../twilio-helper.js');
var client = twilioHelper.client;
var twiml = twilioHelper.twiml;

//  a helper function to gather user input
function gather()

// a webhook to be called by twilio when call statuses are updated
// they are subscribed to when we make a call to /callcenter/call
router.post('/call-status-update', async (req, res) => {
  console.log(req.body);
  return res.json(req.body);
});

// you can set up this webhook by putting the url to this endpoint in your manage phone number screen un Configure
// https://twilio-cms-prod.s3.amazonaws.com/images/ivr-webhook.width-800.png
router.post('/on-call', async (req, res) => {
  console.log(req.body);
  const voiceResponse = new twiml.VoiceResponse();

  const gather = voiceResponse.gather({
    action: '/webhook/on-ivr-action',
    numDigits: '1',
    method: 'POST',
  });

  gather.say(
    'Press 1 if your a new client. ' +
    'Please press 2 if youre an existing client. ' ,
    {loop: 2}
  );

  res.writeHead(200, {'Content-Type': 'text/xml'});
  return res.end(voiceResponse.toString());
});

// this webhook is configured in /webhook/on-call with the action paramter on gather:
// https://www.twilio.com/docs/voice/twiml/gather#action
router.post('/on-ivr-action', async (req, res) => {
  console.log(req.body);
  const twiml = new twilio.TwimlResponse();

  if (request.body.Digits) {
    switch (request.body.Digits) {
      case '1':
        twiml.say('You are a new client. Good for you!');
        break;
      case '2':
        twiml.say('You are an existing client. We will help!');
        break;
      default:
        twiml.say("Sorry, I don't understand that choice.").pause();
        twiml.redirect('/webhook/on-call');
        break;
    }
  }

  res.writeHead(200, {'Content-Type': 'text/xml'});
  return res.end(twiml.toString());
});

module.exports = router