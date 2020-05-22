const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
    phone: {
        type: String,
    },
    callSid: {
        type: String,
    }
})

module.exports = mongoose.model('contactsOnHold', schema);v