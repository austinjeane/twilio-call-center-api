var express = require('express');
var router = express.Router();

var twilioHelper = require('./../twilio-helper.js');
var client = twilioHelper.client;
var twiml = twilioHelper.twiml;

var appUrl = process.env.APP_URL;

var OnHoldCallsModel = require("../models/onHoldCalls.js");
var UserModel = require("../models/user.js");

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
  voiceResponse.say('Please wait while we connect you to the next availible agent. This call may be recorded');
  voiceResponse.dial(agentNumber);
  voiceResponse.record({
      timeout: 10,
      transcribe: true
  });

  console.log(voiceResponse.toString());

  var callRequest = {
    statusCallback: `${appUrl}/webhook/call-status-update`, //optional
    statusCallbackMethod: 'POST', //optional,
      //statusCallbackEvent: ["ringing", "answered", "completed"], // by default only events for 'completed'
      twiml: voiceResponse.toString()
  };
  var call = null;

  // check if contact is on hold 
  var contactOnHold = await OnHoldCallsModel.findOne({
    phone: to
  });

  if(contactOnHold) {
    var deletedContactOnHold = await OnHoldCallsModel.findOneAndRemove({
      phone: to
    });

    call = await  client.calls(contactOnHold.callSid).update(callRequest);
  } else {
    call = await client.calls.create({
      ...callRequest,
      to: `+${to}`,
      from: `+${from}`
    });
  }

  console.log(call);

  // update user is on call
  var updatedUser = await UserModel.findOneAndUpdate(
    {
      phone: agentNumber
    }, 
    {
      call_status: 'on call',
      status: "online",
      last_phone_called: to
    },
    {
      new: true
    });

  return res.json(call);
});

// endpoint to fetch a call with its status, and duration
router.post('/get-call', async (req, res) => {
  const sid = req.body.sid;

  var call = await client.calls(sid).fetch();

  console.log(call);
  
  return res.json(call);
});

// endpoint to fetch calls in progress
router.post('/get-calls', async (req, res) => {
  const sid = req.body.sid;

  var call = await client.calls.list({status: 'in-progress'})

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

// getting users on hold
router.post('/get-calls-on-hold', async (req, res) => {
  var contactsOnHold = await OnHoldCallsModel.find();

  return res.json(contactsOnHold);
});

module.exports = router