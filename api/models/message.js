const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
    from:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    to:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    text:String,
    file:String,
},{timestamps:true});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;