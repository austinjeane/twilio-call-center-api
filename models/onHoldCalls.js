const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
    phone: {
        type: String,
    },
    callSid: {
        type: String,
    },
    expireAt: {
        type: Date,
        default: Date.now,
        index: { expires: '80m' },
      }
})

module.exports = mongoose.model('onHoldCalls', schema);