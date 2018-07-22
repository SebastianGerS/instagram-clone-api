var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var CommentSchema = Schema({
  text: String,
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  mediaItem: {type: Schema.Types.ObjectId, ref: 'MediaItem', required: true },
},  { timestamps: { } });

mongoose.model('Comment', CommentSchema);

module.exports = mongoose.model('Comment');