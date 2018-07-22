var express = require('express');
var router = express.Router({mergeParams: true});
var bodyParser = require('body-parser');
var Comment = require('../models/Comment');
var VerifyToken = require('../middleware/verifyToken');
var MediaItem = require('../models/MediaItem');

router.use(bodyParser.urlencoded({ extended: true}));

router.post('/', VerifyToken ,function(req,res) {
  Comment.create({
    text: req.body.text,
    user: req.userId,
    mediaItem: req.params.mediaItemId,
  }, function(error, comment) {
    if (error) return res.json({error: 'error creating comment ' + error});
    MediaItem.findById(req.params.mediaItemId, function(err, mediaItem) {
      if (err) return res.json({error: 'error binding comment to mediaitem'});
      mediaItem.comments.push(comment._id);
      mediaItem.save();
      return res.json('comment created');
    });  
  });
});

router.delete('/:id', VerifyToken ,function(req,res) {
  Comment.remove({ _id: req.params.id}, function(error) {
    if (error) return res.json({error: 'error removing comment'});
    
    MediaItem.findById(req.params.mediaItemId, function(err, mediaItem) {
      if (err) return res.json({error: ' removing comment from mediaitem'});
      mediaItem.comments.map((comment, index) => {
        
        if(comment == req.params.id) {
          mediaItem.comments.splice(index, 1);
          mediaItem.save();
        }
      });
      return res.json('comment was removed');
    });  
  });
});
router.put('/:id', VerifyToken ,function(req,res) {
  Comment.findOneAndUpdate({_id: req.params.id },{text: req.body.text}, function(error) {
    if (error) return res.json({error: 'error updating comment'});
    
      return res.json('comment was updated');
  });
});

module.exports = router;