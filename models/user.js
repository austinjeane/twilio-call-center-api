const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({

    //name
    given_name: {
        type: String,
    },

    family_name: {
        type: String,
    },

    privileges: {
        type: Array,
        required: true,
        default: []
    },

    picture_url: {
        type: String,
    },

    identifier: {
        type: String,
        default: 'user'
    },

    //contact

    phone: {
        type: String,
    },
    email: {
        type: String,
        required: true,
    },

    //security
    password: {
        type: String,
    },
    security_code: {
        type: String
    },

    //address
    address_line_1: {
        type: String,
    },

    address_line_2: {
        type: String,
    },

    city: {
        type: String,
    },

    state: {
        type: String,
    },

    country: {
        type: String,
    },

    postal_code: {
        type: String,
    },


    //internal rate
    hourly_rate: {
        type: Number,
        required: true,
        default: 0
    },

    //rate to charge clients
    billable_rate: {
        type: Number,
        required: true,
        default: 0
    },

    deleted: {
        type: Boolean,
        default: false,
        required: true
    },

   //persmissions
    is_dev: {
        type: Boolean,
        default: false
    },

    is_admin: {
        type: Boolean,
        default: false
    },


    //login data
    last_login: {
        type: Number,
        default: Math.round((new Date()).getTime() / 1000)
    },

    updated_at: {
        type: Number,
        default: Math.round((new Date()).getTime() / 1000)
    },
    created_at: {
        type: Number,
        default: Math.round((new Date()).getTime() / 1000)
    },

    type: {
        type: String,
        default: 'user',
        required: true
    },

    status: {
        type: String,
        default: 'offline',
        required: true
    },

    call_status: {
        type: String,
        default: 'open' // open or on call
    },

    // the last number that this user called
    last_phone_called: {
        type: String
    },

    call_center_activity: {
        type: String,
        required: false
    },

})

module.exports = mongoose.model('users', schema);