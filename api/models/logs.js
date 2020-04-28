var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var logsSchema = new Schema({
    id : String,
	system_id : String,
	time : Date,
	value : String,
	log_type : String
});

export const Logs = mongoose.model('Logs', logsSchema,'Logs');