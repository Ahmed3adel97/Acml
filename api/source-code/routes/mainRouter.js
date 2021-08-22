const constants = require('../constants.json');
const config = require('../config.json');

var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');

var User = require('../models/user');
var Email = require('../models/email');

const getCheckPeriod = checkPeriod => {
  switch (checkPeriod) {
    case 'daily':
      return constants.daily;
    case 'weekly':
      return constants.weekly;
    case 'monthly':
      return constants.monthly;
    default:
      return constants.monthly;
  }
};

const createToken = user => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    config.secret,
    {
      expiresIn: '12h', // expires in 24 hours
    },
  );
};

// POST route for signup
router.post('/signup', function(req, res, next) {
  if (req.body.password !== req.body.passwordConf) {
    var err = new Error('Passwords Do Not Match');
    err.status = 400;
    return next(err);
  }

  if (req.body.email && req.body.password && req.body.passwordConf) {
    var userData = {
      email: req.body.email,
      password: req.body.password,
      isAlive: true,
      checkPeriod: getCheckPeriod(req.body.checkPeriod),
    };

    User.create(userData, function(error, user) {
      if (error) {
        return next(error);
      } else {
        return res.status(200).json({
          success: true,
          message: 'User Created',
          token: createToken(user),
        });
      }
    });
  } else {
    const err = new Error('Missing Data');
    err.status = 400;
    return next(err);
  }
});

router.post('/login', function(req, res, next) {
  if (req.body.email && req.body.password) {
    User.authenticate(req.body.email, req.body.password, function(error, user) {
      if (error || !user) {
        var err = new Error('Wrong Email Or Password.');
        err.status = 401;
        return next(err);
      } else {
        User.update({ _id: user._id }, { $set: { isAlive: true } }).then(user => {
          return res.status(200).json({
            success: true,
            message: 'Login Was Successfull',
            token: createToken(user),
          });
        });
      }
    });
  } else {
    var err = new Error('All Fields Required.');
    err.status = 400;
    return next(err);
  }
});

// Middleware For Authorizing Users
function requiresLogin(req, res, next) {
  if (req.get('token')) {
    jwt.verify(req.get('token'), config.secret, function(err, decoded) {
      if (err) {
        const err = new Error('Failed To Authenticate Token');
        err.status = 401;
        return next(err);
      } else {
        req.userId = decoded.id;
        req.email = decoded.email;
        return next();
      }
    });
  } else {
    var err = new Error('Not Authorized');
    err.status = 401;
    return next(err);
  }
}

router.post('/updateCheckingPeriod', requiresLogin, function(req, res, next) {
  if (req.body.checkPeriod) {
    User.update({ _id: req.userId }, { $set: { checkPeriod: getCheckPeriod(req.body.checkPeriod) } })
      .then(() => {
        return res.status(200).json({
          success: true,
          message: 'Checking Period Was Updated Successfull',
        });
      })
      .catch(err => next(err));
  } else {
    var err = new Error('Missing Update Data');
    err.status = 400;
    return next(err);
  }
});

router.get('/getWills', requiresLogin, function(req, res, next) {
  Email.find({ userID: req.userId })
    .then(wills => {
      return res.status(200).json({
        success: true,
        wills: wiils,
      });
    })
    .catch(err => next(err));
});

router.post('/editWill', requiresLogin, function(req, res, next) {
  if (req.body.emailID && req.body.text && req.body.recipents && req.body.recipents.length > 0 && req.body.subject) {
    const updateObj = {
      senderEmail: req.email,
      text: req.body.text,
      recipents: req.body.recipents,
      subject: req.body.subject,
    };
    if (req.body.isReminder && req.body.remindingDate) {
      updateObj.isReminder = true;
      updateObj.remindingDate = req.body.remindingDate;
    }
    Email.update(
      { _id: req.body.emailID, userID: req.userId },
      {
        $set: updateObj,
      },
    )
      .then(() => {
        return res.status(200).json({
          success: true,
          message: 'Will Created Successfully',
        });
      })
      .catch(err => next(err));
  } else {
    var err = new Error('Missing Update Data');
    err.status = 400;
    return next(err);
  }
});

router.post('/addWill', requiresLogin, function(req, res, next) {
  if (req.body.text && req.body.recipents && req.body.recipents.length > 0 && req.body.subject) {
    const createObj = {
      userID: req.userId,
      senderEmail: req.email,
      text: req.body.text,
      recipents: req.body.recipents,
      subject: req.body.subject,
    };
    if (req.body.isReminder && req.body.remindingDate) {
      createObj.isReminder = true;
      createObj.remindingDate = req.body.remindingDate;
    }
    Email.create(createObj)
      .then(() => {
        return res.status(200).json({
          success: true,
          message: 'Will Created Successfully',
        });
      })
      .catch(err => next(err));
  } else {
    var err = new Error('Missing Email Data');
    err.status = 400;
    return next(err);
  }
});

router.post('/removeWills', requiresLogin, function(req, res, next) {
  if (req.body.emailID) {
    Email.remove({ _id: req.body.emailID, userID: req.userId })
      .then(() => {
        return res.status(200).json({
          success: true,
          message: 'Removed Sucessfully',
        });
      })
      .catch(err => next(err));
  } else {
    var err = new Error('Missing Email ID');
    err.status = 400;
    return next(err);
  }
});

module.exports = router;
