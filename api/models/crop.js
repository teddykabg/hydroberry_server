var mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
var Schema = mongoose.Schema;


var cropSchema = new Schema({
    id: String,
    name:{
        type: String,
        required: true,
        unique: true
    }
});

cropSchema.plugin(uniqueValidator);

export const Crop = mongoose.model('Crop', cropSchema,'Crop');