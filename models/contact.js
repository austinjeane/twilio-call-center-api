const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({

    ///////////////////////////////////
    // identity
    ///////////////////////////////////
    given_name: {
        type: String,
    },
    family_name: {
        type: String,
    },

    middle_name: {
        type: String,
    },

    title: {
        type: String,
    },

    suffix: {
        type: String,
    },

    nickname: {
        type: String,
    },

    picture_url: {
        type: String,
    },

    identifier: {
        type: String,
        default: 'contact'
    },

    ///////////////////////////////////////
    // All staff and system generated notes
    ///////////////////////////////////////

    notes: {
        type: Array,
        default: []
    },

    ///////////////////////////////////
    // case association
    ///////////////////////////////////
    cases_associated: [{ //cases that this contact i s associated to
        case_id: {
            type: Schema.Types.ObjectId,
            ref: 'cases'
        },
        case_name: String,
        case_role: String,
        default: []
    }],

    cases_client: [{ //cases where the client is the contact
        case_id: {
            type: Schema.Types.ObjectId,
            ref: 'cases'
        },
        case_name: String,
        default: []
    }],

    ///////////////////////////////////
    // Personal Information
    ///////////////////////////////////

    occupation: {
        type: String,
    },

    dob: {
        type: String,
    },

    gender: {
        type: String, // male | female | null
    },

    employer: {
        type: String,
    },

    marital_status: {
        type: String, // not married | married | divorced | separated | widow(er) | domestic partners
    },

    ///////////////////////////////////
    // Contact
    ///////////////////////////////////
    phone: {
        type: String,
    },
    phone_2: {
        type: String,
    },

    phone_3: {
        type: String,
    },

    phone_confirmed: {
        type: Boolean,
        default: false,
    },

    email: {
        type: String,
        required: true,
    },

    email_2: {
        type: String,
    },

    email_3: {
        type: String,
    },

    email_confirmed: {
        type: Boolean,
        default: false,
    },

    fax_number: {
        type: String,
    },

    ///////////////////////////////////
    // Security
    ///////////////////////////////////
    password: {
        type: String,
    },
    security_code: {
        type: String
    },

    ///////////////////////////////////
    // Address
    ///////////////////////////////////
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

    postal_code: {
        type: String,
    },

    country: {
        type: String,
    },

    ///////////////////////////////////
    // Billing
    ///////////////////////////////////
    billing_address_line_1: {
        type: String,
    },

    billing_address_line_2: {
        type: String,
    },

    billing_city: {
        type: String,
    },

    billing_state: {
        type: String,
    },

    billing_country: {
        type: String,
    },

    billing_postal_code: {
        type: String,
    },

    ///////////////////////////////////
    // Associations
    ///////////////////////////////////
    //payment details
    law_pay_id: {
        type: String,
    },

    relationships: {
        type: Array
    },

    relationship_identifiers: {
        type: Array
    },


    ///////////////////////////////////
    // Timestamps
    ///////////////////////////////////

    updated_at: {
        type: Number,
        default: Math.round((new Date()).getTime() / 1000)
    },
    created_at: {
        type: Number,
        default: Math.round((new Date()).getTime() / 1000)
    },

    ///////////////////////////////////
    // MISC
    ///////////////////////////////////

    last_contact: {
        type: String,
    },

    last_contact_by: {
        type: Schema.Types.ObjectId,
        ref: 'users',
    },

    total_contacts: {
        type: Number,
        default: 0,
        required: true
    },

    default_account_vault_id: {
        type: String,
        default: null,
    },

    metadata: {
        type: Object,
        default: {},
    },

    notes: {
        type: Array,
    },

    website: {
        type: String,
    },

    deleted: {
        type: Boolean,
        default: false,
        required: true
    },

    type: {
        type: Array,
        default: [],
        required: true
    },

    assigned_user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },


})

module.exports = mongoose.model('contacts', schema);