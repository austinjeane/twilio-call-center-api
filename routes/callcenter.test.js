var assert = require('assert');
const request = require('supertest');
var app = require("../index.js");

describe('/callcenter endpoints', function() {

  describe('/call', function() {

    it('should connect successfully', async function() {
        // this is a magic number for twilio testing
        // https://www.twilio.com/docs/iam/test-credentials
        const from = "15005550006";

        // any regular number
        const to = "4691111111";

        // any regular number
        const agentNumber = "4691111112";

        return request(app)
        .post('/callcenter/call')
        .send({to, from, agentNumber})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response => {
            assert(response.body.status, 'queued');
        })
    });

  });

  // cannot get call with test credentials so this test will need to be done on real paid number
  // describe('/getcall', function() {

  //   it('should connect successfully', async function() {
  //       // this is a magic number for twilio testing
  //       // https://www.twilio.com/docs/iam/test-credentials
  //       const from = "15005550006";

  //       // any regular number
  //       const to = "4691111111";

  //       // any regular number
  //       const agentNumber = "4691111112";

  //       var response = await request(app)
  //       .post('/callcenter/call')
  //       .send({to, from, agentNumber})
  //       .set('Accept', 'application/json')
  //       .expect('Content-Type', /json/)
  //       .expect(200);

  //       var response = await request(app)
  //       .post('/callcenter/getcall')
  //       .send({sid: response.body.sid})
  //       .set('Accept', 'application/json')
  //       .expect('Content-Type', /json/)
  //       .expect(200);
  //   });

  // });

});