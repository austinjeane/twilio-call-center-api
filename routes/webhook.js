var express = require('express');
var router = express.Router();

var { client, twiml } = require('./../twilio-helper.js');

var ContactOnHoldModel = require("../models/contactsOnHold.js");
var UserModel = require("../models/user.js");
var ContactModel = require("../models/contact.js");

//  a helper function to put on hold
function putOnHoldResponse(phone, callSid) {
  const response = new twiml.VoiceResponse();
  response.say("All of our agents are busy at the moment. Please hold");
  response.play({
      loop: 0
  }, 'https://api.twilio.com/cowbell.mp3'); //todo: replace will your own mp3

  var contactOnHold = new ContactOnHoldModel({
    phone,
    callSid
  });
  
  var saved = await contactOnHold.save();

  return response;
}

// a webhook to be called by twilio when call statuses are updated
// they are subscribed to when we make the call and in the number configuration for call status
router.post('/call-status-update', async (req, res) => {
  console.log(req.body);
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;
  const to = req.body.To;

  //todo: find user.lastCallSid by callSid and update user status based on call status

  //they hung up
  if(callStatus === "completed") {
    var callOnHold = await ContactOnHoldModel.findOne({callSid});
    if(callOnHold) { 
      var deletedContactOnHold = await ContactOnHoldModel.findOneAndRemove({callSid});
    }

    var updatedUser = await UserModel.findOneAndUpdate(
      {
        call_status: 'on call',
        last_phone_called: to
      },
      {
        call_status: 'open',
      },{new: true});
  }

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
  var contact = await ContactModel.findOne({phone: from}).populate("assigned_user").exec();

  if(contact != null) {
    var assignedUser = contact.assignedUser;

    console.log("Found assigned user: ");
    console.log(assignedUser);

    if(assignedUser != null && assignedUser.status === "online") {
      if(assignedUser.call_status === "open") {
        var updatedUser = await UserModel.findOneAndUpdate(
          {
            phone: assignedUser.phone
          }, 
          {
            call_status: 'on call',
            last_phone_called: to
          },
          {
            new: true
          });

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
        // todo:save somewhere that this person is on hold with callSid
        res.set('Content-Type', 'text/xml');
        return res.send(putOnHoldResponse(from, callSid).toString());
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
        //todo: do something?
        //response.say('You are a new client. Good for you!');
        break;
      case '2':
        //response.say('You are an existing client. We will help!');
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
    // check if any users online, if so put on hold. otherwise played closed message.
    response.say("We are currently closed. Please try to call back during business hours");
  }

  res.set('Content-Type', 'text/xml');
  return res.send(response.toString());
});

module.exports = router