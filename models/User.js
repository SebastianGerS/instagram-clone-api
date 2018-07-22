var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Schema = mongoose.Schema;
var UserSchema = new Schema({
  email: {type:String, unique:true},
  username: {type:String, unique:true},
  password: {type: String, minlength: [8, 'passwords must be 8 characters or longer']},
  fullname: String,
  profilePicture: String,
  profilePictureId: String,
  bio: String,
  website: String,
  mediaItems: [{type: Schema.Types.ObjectId, ref: 'MediaItem' }],
  follows: [{type: Schema.Types.ObjectId, ref: 'User' }],
  followedBy: [{type: Schema.Types.ObjectId, ref: 'User' }],
  
},{ timestamps: { } });

UserSchema.pre('save', function(next) {
  var user = this;
  var rounds = 5;
  if(!user.isModified('password')) return next();
  bcrypt.genSalt(rounds, function(error, salt) {
    if (error) return next(error);

    bcrypt.hash(user.password, salt, function(error, hash) {
      if (error) return next(error);
      user.password = hash;
      next();
    });
  });
});
mongoose.model('User', UserSchema);

module.exports = mongoose.model('User');