var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var User = require('../models/User');
var Tag = require('../models/Tag');
var Comment = require('../models/Comment');
var MediaItem = require('../models/MediaItem');
var VerifyToken = require('../middleware/verifyToken');
var multer = require('multer');
var uuidv1 = require("uuid");
var fs = require('fs');
var config = require('../config');
var cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: config.cloudName,
  api_key: config.cloudKey,
  api_secret: config.cloudSecret,
});

router.use(bodyParser.urlencoded({ extended: true}));
var storage = multer.diskStorage({
  destination: './public/images',
  filename(req,data,cb) {
    cb(null, uuidv1() + data.originalname);
  },
});

var upload = multer({storage});

router.post('/', [VerifyToken, upload.single('data')],function(req,res) {
  var tags = [];
  var tagCounter = 0;
  var newTags = req.body.tags.split(',');
  
  newTags.forEach(tagname => {
    
    var tag = Tag.findOne({tagname: tagname},function(err, tag) {
      if (err) return res.status(500).json({error: 'error retreving tag'});
      
      if (!tag) {
        Tag.create({tagname: tagname}, function(error, newtag) {
          if (error) return res.status(500).json({error: 'error creating tag'});
          tags.push(newtag._id);
          tagCounter++;
          if(tagCounter == newTags.length) {
            cloudinary.v2.uploader.upload(req.file.path, 
              { eager: 
                [
                  { width: 660, height: 660, crop: "fill" }
                ]                              
             }, function(error, cloudinaryResult) {
              if (error)  {
                var message = {message: 'error trying to upload images to cloudinary with error: ' + error };
                return res.status(200).json(message);
              }
              MediaItem.create({
                images: {
                  url: cloudinaryResult.eager[0].secure_url,
                  id: cloudinaryResult.public_id,
                },
                type: 'image',
                comments: [],
                likes: [],
                tags: tags,
                caption: req.body.caption,
                user: req.userId,
                location: req.body.location
              }, function(error,mediaItem) {
                if(error) {
                  var message = JSON.stringify({error: "error occurred when trying to add new mediaItem with " + error});
                  return res.status(500).send(message);
                }
  
                User.findById(req.userId, function(err, user) {
                  if (err) return res.status(500).json({error: 'error occurred when binding mediaItem to user'});
                  if (!user) return res.status(500).json({error: 'error occurred trying to fetch user'});
                  user.mediaItems.push(mediaItem._id);
                  user.save();
                  return res.status(200).json(mediaItem);
                });
              });
            });
          }
        } );
      } else {
        tags.push(tag._id);
        tagCounter++;
        if(tagCounter == newTags.length) {
          cloudinary.v2.uploader.upload(req.file.path, 
            { eager: 
              [
                { width: 660, height: 660, crop: "fill" }
              ]                              
           },
            function(error, cloudinaryResult) {
            if (error)  {
              var message = {message: 'error trying to upload images to cloudinary with error: ' + error };
              return res.status(200).json(message);
            }
           
            MediaItem.create({
              images: {
                url: cloudinaryResult.eager[0].secure_url,
                id: cloudinaryResult.public_id,
              },
              type: 'image',
              comments: [],
              likes: [],
              tags: tags,
              caption: req.body.caption,
              user: req.userId,
              location: req.body.location
            }, function(error,mediaItem) {
              if(error) {
                var message = JSON.stringify({error: "error occurred when trying to add new mediaItem with " + error});
                return res.status(500).send(message);
              }
          
              User.findById(req.userId, function(err, user) {
                if (err) return res.status(500).json({error: 'error occurred when binding mediaItem to user'});
                if (!user) return res.status(500).json({error: 'error occurred trying to fetch user'});
                user.mediaItems.push(mediaItem._id);
                user.save();
                return res.status(200).json(mediaItem);
              });
            });
          });
        }
      }
    });
  });
});

router.get('/',VerifyToken, function(req,res) {
  MediaItem.find({user: {$nin: req.userId }})
    .sort({createdAt: 'desc' })
    .populate({path: 'user', select: ['_id', 'username', 'fullname', 'profilePicture']})
    .populate({path: 'comments', populate: {path: 'user', select: ['_id', 'username', 'fullname', 'profilePicture']}})
    .populate({path: 'tags'})
    .lean().exec(function(err, mediaItems) {
      if (err) return res.status(500).json({error: 'error retreving mediaitems'});
      if (mediaItems) {
        return res.status(200).json(mediaItems);
      } else {
        return res.status(404).json({error: 'no mediaItems found'});
      }
    
    });
});

router.get('/all', function(req,res) {
  MediaItem.find()
    .sort({createdAt: 'desc' })
    .populate({path: 'user', select: ['_id', 'username', 'fullname', 'profilePicture']})
    .populate({path: 'comments', populate: {path: 'user', select: ['_id', 'username', 'fullname', 'profilePicture']}})
    .populate({path: 'tags'})
    .lean().exec(function(err, mediaItems) {
      if (err) return res.status(500).json({error: 'error retreving mediaitems'});
      if (mediaItems) {
        return res.status(200).json(mediaItems);
      } else {
        return res.status(404).json({error: 'no mediaItems found'});
      }
    
    });
});

router.get('/follows', VerifyToken, function(req,res) {
  User.findById(req.userId).lean().exec(function (error, user) {
    if (error) return res.status(500).json({error: 'error retreving user'});
    MediaItem.find({user: {$in: user.follows }})
      .sort({createdAt: 'desc' })
      .populate({path: 'user', select: ['_id', 'username', 'fullname', 'profilePicture']})
      .populate({path: 'comments', populate: {path: 'user', select: ['_id', 'username', 'fullname', 'profilePicture']}})
      .populate({path: 'tags'})
      .lean().exec(function(err, mediaItems) {
        if (err) return res.status(500).json({error: 'error retreving mediaitems'});
        if (mediaItems.length) {
          return res.status(200).json(mediaItems);
        } else {
          return res.status(404).json({error: 'no mediaItems found'});
        }
      
      });
  });
});
router.get('/selfe',VerifyToken, function(req,res) {
  MediaItem.find({user: req.userId})
    .sort({createdAt: 'desc' })
    .populate({path: 'user', select: ['_id', 'username', 'fullname', 'profilePicture']})
    .populate({path: 'comments', populate: {path: 'user', select: ['_id', 'username', 'fullname', 'profilePicture']}})
    .populate({path: 'tags'})
    .lean().exec(function(err, mediaItems) {
      if (err) return res.status(500).json({error: 'error retreving mediaitems'});
      if (mediaItems) {
        return res.status(200).json(mediaItems);
      } else {
        return res.status(404).json({error: 'no mediaItems found'});
      }
    
    });
});
router.get('/:userId', function(req,res) {
  MediaItem.find({user: req.params.userId})
    .sort({createdAt: 'desc' })
    .populate({path: 'user', select: ['_id', 'username', 'fullname', 'profilePicture']})
    .populate({path: 'comments', populate: {path: 'user', select: ['_id', 'username', 'fullname', 'profilePicture']}})
    .populate({path: 'tags'})
    .lean().exec(function(err, mediaItems) {
      if (err) return res.status(500).json({error: 'error retreving mediaitems'});
      if (mediaItems) {
        return res.status(200).json(mediaItems);
      } else {
        return res.status(404).json({error: 'no mediaItems found'});
      }
    
    });
});
router.delete('/:id',VerifyToken, function(req,res) {
  MediaItem.deleteOne({_id: req.params.id , user: req.userId}, function(err) {
    if (err) return res.status(500).json({error: 'error deleting mediaitems'});
    Comment.deleteMany({mediaItem: req.params.id}, function(error) {
      if (error) return res.status(500).json({error: 'error deleting the mediaitems comments'});
      User.findById(req.userId, function(e, user) {
        if (e) return res.status(500).json({error: 'error removing attachment of mediaItem from user'});
        user.mediaItems.forEach(function(mediaItem, index) {
          if (mediaItem == req.params.id) {
            user.mediaItems.splice(index,1);
            user.save();
            cloudinary.v2.uploader.destroy(req.body.publicId,function(error, cloudinaryD) {
              if (error)  {
                var message = {message: 'error trying to remove image from cloudinary with error: ' + error };
                return res.status(200).json(message);
              }   
              return res.status(200).json({message: 'deleted mediaItem and attached comments and removed attachemt from user'});
            });  
          }
        });
      });
    });
  }); 
});

router.put('/:id', VerifyToken, function (req,res) {
  MediaItem.findById(req.params.id, function(err, mediaItem) {
    if (err) return res.status(500).json({error: 'error retreving mediaitem'});
    
    if(mediaItem.user == req.userId) {
     
      if(req.body.caption){
        mediaItem.caption = req.body.caption;
        mediaItem.location = req.body.location;
        var tags = [];
        var tagCounter = 0;
        if (req.body.tags.length !== 0) {
          req.body.tags.forEach(tagname => {
            
            Tag.findOne({tagname: tagname},function(err, tag) {
              if (err) return res.status(500).json({error: 'error retreving tag'});
            
              if (tag == null) {
                
                Tag.create({tagname: tagname}, function(error, newtag) {
                  if (error) return res.status(500).json({error: 'error retreving tag'});
                  
                  tags.push(newtag._id);
                  tagCounter++;
                  if(tagCounter == req.body.tags.length) {
                
                    mediaItem.tags = tags;
                    mediaItem.save();
                    return res.json({message: 'media items tags where updated'});
                  }
                } );
              } else {
                tags.push(tag._id);
                tagCounter++;
                if(tagCounter == req.body.tags.length) {
                
                  mediaItem.tags = tags;
                  mediaItem.save();
                  return res.json({message: 'mediaitem was updated'});
                }
              }
            });
          });
        } else {
          mediaItem.tags = tags;
          mediaItem.save();
          return res.json({message: 'mediaitem was updated'});
        }
      } else {
        var toBeAdded = true;
  
        mediaItem.likes = mediaItem.likes.filter(function(like) {
          if(like == req.userId) {
            toBeAdded = false;
          }
          return like != req.userId;
        });
  
        if(toBeAdded) {
          mediaItem.likes.push(req.userId);
          mediaItem.save();
          return res.json({message: 'media item was liked'});
        }
  
        mediaItem.save();
        return res.json({message: 'media item was unliked'});
      }
    } else {
      var toBeAdded = true;

      mediaItem.likes = mediaItem.likes.filter(function(like) {
        if(like == req.userId) {
          toBeAdded = false;
        }
        return like != req.userId;
      });

      if(toBeAdded) {
        mediaItem.likes.push(req.userId);
        mediaItem.save();
        return res.json({message: 'media item was liked'});
      }

      mediaItem.save();
      return res.json({message: 'media item was unliked'});
    }
  });
});
module.exports = router;