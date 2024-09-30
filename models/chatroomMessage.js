const mongoose = require('mongoose');

//added timestamp for sorting
const chatroomMessageSchema = new mongoose.Schema({
    uname: { type: String, required: true },
    userMessage: { type: String, required: true },
    dateAndTime: { type: String, default: "" },
    timeStamp: { type: Date, default: Date.now }
}, { collection: 'chatroomMessages' });

module.exports = mongoose.model('chatroomMessage', chatroomMessageSchema);