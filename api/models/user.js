// const mongoose = require('mongoose');
// const passportLocalMongoose = require('passport-local-mongoose');

// const UserSchema = new mongoose.Schema({
//     name:String,
// },{timestamps:true})
// UserSchema.plugin(passportLocalMongoose);
// module.exports = mongoose.model('User',UserSchema);

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {type:String, unique:true},
  password: String,
}, {timestamps: true});

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;