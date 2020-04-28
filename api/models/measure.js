var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var measureSchema = new Schema({
    id:String,
    system_id : String,
	crop_id : String,
	time: Date,
    hour_slot: Number, 
    month_slot:Number,
    day_slot: Number, 
    week_slot: Number,
    year_slot: Number,
    lux: Boolean,
    temp_env : Number,
    hum_env: Number,
    temp_wat: Number,
    ph : Number,
    ec: Number
});

export const Measurement = mongoose.model('Measurement', measureSchema,'Measurement');