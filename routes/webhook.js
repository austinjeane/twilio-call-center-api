var express = require('express');
var router = express.Router();
var moment = require('moment-timezone');

var { client, twiml } = require('./../twilio-helper.js');

var OnHoldCallsModel = require("../models/onHoldCalls.js");
var UserModel = require("../models/user.js");
var ContactModel = require("../models/contact.js");

var appUrl = process.env.APP_URL;

//  a helper function to put on hold
async function putOnHoldResponse(phone, callSid) {
  const response = new twiml.VoiceResponse();
  response.say("All of our agents are busy at the moment. Please hold");
  response.play({
      loop: 0
  }, 'https://api.twilio.com/cowbell.mp3'); //todo: replace will your own mp3

  var contactOnHold = new OnHoldCallsModel({
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
  const to = req.body.To.replace("+", "");
  const direction = req.body.Direction;
  const caller = req.body.Caller.replace("+", "");

  //they hung up
  if(callStatus === "completed") {
    var callOnHold = await OnHoldCallsModel.findOne({callSid});
    if(callOnHold) { 
      var deletedContactOnHold = await OnHoldCallsModel.findOneAndRemove({callSid});
    }

    var updatedUser = await UserModel.findOneAndUpdate(
      {
        call_status: 'on call',
        last_phone_called: direction === "inbound" ? caller : to
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
  const from = req.body.From.replace("+", "");

  var date = moment().tz("America/New_York");

  // returns 1-7 where 1 is Monday and 7 is Sunday
  var weekday = date.isoWeekday(); 

  var startTime = moment('08:00 am', "HH:mm a"); 
  var endTime = moment('05:00 pm', "HH:mm a"); 

  // if it is saturday or sunday or not in business hours
  if(weekday === 6 || weekday === 7 || date.isBetween(startTime, endTime) == false) {
    response.say("Sorry, we are currently closed. Our business hours are Monday through Friday from 8 A.M. to 5 P.M.");
    res.set('Content-Type', 'text/xml');
    return res.send(response.toString());
  }

  // todo: lookup contact by from number
  var contact = await ContactModel.findOne({phone: from}).populate("assigned_user").exec();

  if(contact != null) {
    var assignedUser = contact.assigned_user;

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
            last_phone_called: from
          },
          {
            new: true
          });

        response.say("Connecting you to " + assignedUser.given_name + " " + assignedUser.family_name);

        const dial = response.dial({
          statusCallbackEvent: ["ringing", "answered", "completed"],
          statusCallback: `${appUrl}/webhook/call-status-update`,
          timeout: 10,
          transcribe: true
        });

        res.set('Content-Type', 'text/xml');
        return res.send(response.toString());
      } else {
        // todo contact on hold to wait for assigned user to be free
        // todo:save somewhere that this person is on hold with callSid
        var onHoldResponse = await putOnHoldResponse(from, callSid);
        res.set('Content-Type', 'text/xml');
        return res.send(onHoldResponse.toString());
      }
      
    }
  }

  // todo: check business hours and possibly reply differently
    
  const gather = response.gather({
    action: `${appUrl}/webhook/on-ivr-action`,
    numDigits: '1',
    method: 'POST',
  });

  gather.say(
    'Press 1 if your a new client. ' +
    'Please press 2 if youre an existing client. ' ,
    {loop: 1}
  );

  res.set('Content-Type', 'text/xml');
  return res.send(response.toString());

});

// this webhook is configured in /webhook/on-call with the action paramter on gather:
// https://www.twilio.com/docs/voice/twiml/gather#action
router.post('/on-ivr-action', async (req, res) => {
  console.log(req.body);
  const from = req.body.From;
  const response = new twiml.VoiceResponse();
  
  if (req.body.Digits) {
    switch (req.body.Digits) {
      case '1':
        //todo: do something?
        //response.say('You are a new client. Good for you!');
        break;
      case '2':
        //response.say('You are an existing client. We will help!');
        break;
      default:
        response.say("Sorry, I don't understand that choice.").pause();
        response.redirect(`${appUrl}/webhook/on-call`); // ready choices again
        break;
    }
  }

  //todo: find user currently not on phone
  var userNotOnPhone = await UserModel.findOne({ status: "online", call_status: "open" });
  
  if(userNotOnPhone != null) {

    userNotOnPhone.call_status = "on call";
    userNotOnPhone.last_phone_called = from;
    userNotOnPhone.save();

    response.say("Connecting you to " + userNotOnPhone.given_name + " " + userNotOnPhone.family_name).pause();

    const dial = response.dial({
      //statusCallbackEvent: ["ringing", "answered", "completed"],
      statusCallback: `${appUrl}/webhook/call-status-update`,
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

module.exports = router;