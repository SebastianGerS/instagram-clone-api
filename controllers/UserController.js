var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({ extended: true}));
var User = require('../models/User');
var verifyToken = require('../middleware/verifyToken');

router.get('/', verifyToken ,function(req,res, next) {
  User.find({},function(error,users) {

    if(error) {
      return res.status(500).send("error occurred when trying to get users from database");
    }

    return res.status(200).send(users);
  
  });
});
router.get('/:id', function(req,res) {
  User.findById(req.params.id,function(error,user) {

    if(error) {
      return res.status(500).send("error occurred when trying to get user from database");
    }

    return res.status(200).send(user);
  
  });
});

router.delete('/:id', verifyToken,function(req,res) {
  User.findByIdAndRemove(req.params.id,function(error,user) {

    if(error) {
      return res.status(500).send("error occurred when trying to delete user from database");
    }

    return res.status(200).send('User ' + user.username + ' was deleted from database');
  
  });
});
router.put('/:id', verifyToken,function(req,res) {
  User.findById(req.userId, function(error, user) {
    if (error) return res.json({error: 'error trying to find user'});

    if(!user) return res.json({error: 'no user conected to the provided token could be found'});

    User.findById(req.params.id, function(err, followedUser) {
      if (error) return res.json({error: 'error trying to find the followed user'});

      if (!followedUser) return res.json({error: 'no user conected to the provided token could be found'});
      let tobeFollowed = true;
      let toFollow = true;

      user.follows.map((followed, index) => {
        if (followed == req.params.id ) {
          user.follows.splice(index, 1);
          toFollow = false;
          user.save();
        }
      });
      if (toFollow) {
     
        user.follows.push(req.params.id);
        user.save();
      }
      
      followedUser.followedBy.map((follower, index) => {
        if (follower == req.userId ) {
          followedUser.followedBy.splice(index, 1);
          tobeFollowed = false;
          followedUser.save();
        }
      });
      if (tobeFollowed) {
        followedUser.followedBy.push(req.userId);
        followedUser.save();
        return res.status(200).json({message: 'you are now following ' + followedUser.username});
      } else {
      return res.status(200).json({message: 'you are no longer following ' + followedUser.username});
      }
    });
  });
});
module.exports = router;

