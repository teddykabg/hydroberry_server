var mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
var Schema = mongoose.Schema;


var userSchema = new Schema({
    id:String,
    fullname: {
        type: String,
        required: true,
        unique: true
    },
    password: String,
    email:{
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    role :String,
    systems: [String]
});

userSchema.plugin(uniqueValidator);

export const User = mongoose.model('User', userSchema,'User');