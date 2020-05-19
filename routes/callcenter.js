var express = require('express');
var router = express.Router();

var twilioHelper = require('./../twilio-helper.js');
var client = twilioHelper.client;
var twiml = twilioHelper.twiml;

var appUrl = process.env.APP_URL;

// makes an outbound call to a customer's phone number. when the call is answered it will 
// make a call to a call center agent's phone number to connect with the customer
router.post('/call', async (req, res) => {
  // number we are calling
  const to = req.body.to;

  // our twilio number we are using to dial out with
  const from = req.body.from;

  // the call center agent's number that will be called and connected
  const agentNumber = req.body.agentNumber;

  const voiceResponse = new twiml.VoiceResponse();
  voiceResponse.say('Please wait while we connect you to the next availible agent');
  voiceResponse.dial(agentNumber);
  voiceResponse.record({
      timeout: 10,
      transcribe: true
  });

  console.log(voiceResponse.toString());

  var call = await client.calls
    .create({
      statusCallback: `${appUrl}/callcenter/call-status-update`, //optional
      statusCallbackMethod: 'POST', //optional
      twiml: voiceResponse.toString(),
      to: `+${to}`,
      from: `+${from}`
    });

  console.log(call);

  return res.json(call);
});

// endpoint to fetch a call with its status, and duration
router.post('/get-call', async (req, res) => {
  const sid = req.body.sid;

  var call = await client.calls(sid).fetch();

  console.log(call);
  
  return res.json(call);
});

// endpoint to fetch a call recording
router.post('/get-call-recording', async (req, res) => {
  const sid = req.body.sid;

  var recordings = await client.calls(sid).recordings.fetch();

  console.log(recordings);

  // we can return mp3 link here if you like
  
  return res.json(recordings);
});

module.exports = router