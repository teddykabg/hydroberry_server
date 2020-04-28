var mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
var Schema = mongoose.Schema;

var systemSchema = new Schema({
    id: String,
    system_name: {
        type: String,
        required: true,
        unique: true
    },
    otp: {
        type: String,
        required: true,
        unique: true
    },
    expiry_date_otp: Date,
    tmp_lastdata_upload: Date,
    firmware_version: String,
    authorized_people: [String],
    active_advices: [String],
    active_alarms: [String],
    crops: [String]
});

systemSchema.plugin(uniqueValidator);

export const System = mongoose.model('System',systemSchema,'System');