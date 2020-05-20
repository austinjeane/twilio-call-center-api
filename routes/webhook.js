var express = require('express');
var router = express.Router();

var twilioHelper = require('./../twilio-helper.js');
var client = twilioHelper.client;
var twiml = twilioHelper.twiml;

//  a helper function to gather user input
function gather()

// a webhook to be called by twilio when call statuses are updated
// they are subscribed to when we make the call
router.post('/call-status-update', async (req, res) => {
  console.log(req.body);
  const callSid = req.body.CallSid;

  //todo: find user.lastCallSid by callSid and update user status based on call status

  return res.json(req.body);
});

// you can set up this webhook by putting the url to this endpoint in your manage phone number screen un Configure
// https://twilio-cms-prod.s3.amazonaws.com/images/ivr-webhook.width-800.png
router.post('/on-call', async (req, res) => {
  console.log(req.body);
  const response = new twiml.VoiceResponse();
  const callSid = req.body.CallSid;
  const from = req.body.From;

  // todo: lookup contact by from number
  var contact = {};

  if(contact != null) {
    // todo: lookup user by contact.assigned_user
    var assignedUser = {};

    if(assignedUser != null && assignedUser.status === "online") {
      if(assignedUser.call_status === "open") {
        // todo: update database and save the callSid to assignedUser.lastCallSid

        response.say("Connecting you to " + assignedUser.given_name + " " + assignedUser.family_name);

        const dial = response.dial({
          statusCallbackEvent: ["ringing", "answered", "completed"],
          statusCallback: "/webhook/call-status-update",
          //recordingStatusCallback: recordURLCallback, //use this endpoint to get notified when recording is ready
        });
        dial.number('+'+assignedUser.phone);

        response.record({
          timeout: 10,
          transcribe: true
        });

        res.set('Content-Type', 'text/xml');
        return res.send(response.toString());
      } else {
        // todo contact on hold to wait for assigned user to be free
      }
      
    }
  } else {
    // todo: check business hours and possibly reply differently
    
    const gather = response.gather({
      action: '/webhook/on-ivr-action',
      numDigits: '1',
      method: 'POST',
    });
  
    gather.say(
      'Press 1 if your a new client. ' +
      'Please press 2 if youre an existing client. ' ,
      {loop: 2}
    );
  
    res.set('Content-Type', 'text/xml');
    return res.send(response.toString());
  }

});

// this webhook is configured in /webhook/on-call with the action paramter on gather:
// https://www.twilio.com/docs/voice/twiml/gather#action
router.post('/on-ivr-action', async (req, res) => {
  console.log(req.body);
  const response = new twilio.TwimlResponse();
  
  if (request.body.Digits) {
    switch (request.body.Digits) {
      case '1':
        response.say('You are a new client. Good for you!');
        break;
      case '2':
        response.say('You are an existing client. We will help!');
        break;
      default:
        response.say("Sorry, I don't understand that choice.").pause();
        response.redirect('/webhook/on-call'); // ready choices again
        break;
    }
  }

  //todo: find user currently not on phone
  var userNotOnPhone = {};
  
  if(userNotOnPhone != null) {
    response.say("Connecting you to " + userNotOnPhone.given_name + " " + userNotOnPhone.family_name);

    const dial = response.dial({
      statusCallbackEvent: ["ringing", "answered", "completed"],
      statusCallback: "/webhook/call-status-update",
      //recordingStatusCallback: recordURLCallback, //use this endpoint to get notified when recording is ready
    });
    dial.number('+'+userNotOnPhone.phone);

    response.record({
      timeout: 10,
      transcribe: true
    });
  } else {
    // todo: put on hold?
  }

  res.set('Content-Type', 'text/xml');
  return res.send(response.toString());
});

module.exports = router