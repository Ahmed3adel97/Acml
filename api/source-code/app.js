const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const config = require('./config.json');
const Constants = require('./constants.json');
const mainRouter = require('./routes/mainRouter');
const User = require('./models/user');
const Email = require('./models/email');

var app = express();

//connect to MongoDB
mongoose.connect(config.dbUrl);
const db = mongoose.connection;

//handle mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected To DB');
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api', mainRouter);

app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({
    message: err.message,
    errCode: err.status || 500,
  });
});

// create mail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.emailUser,
    pass: config.emailPassword,
  },
});

const checkJob = period => {
  console.log(`Starting The ${period} Check`);
  getDeadUsers(period)
    .then(deadUsers =>
      getDeadUsersEmails(deadUsers)
        .then(deadUsersEmails =>
          sendEmails(deadUsersEmails)
            .then(() =>
              cleanDB(deadUsers, deadUsersEmails)
                .then(() => {
                  changeUserState(period)
                    .then(console.log(`${period} Job Finished`))
                    .catch(err => console.error.bind(console, err.message));
                })
                .catch(err => console.error.bind(console, err.message)),
            )
            .catch(errs => errs.map(err => console.error.bind(console, err.message))),
        )
        .catch(err => console.error.bind(console, err.message)),
    )
    .catch(err => console.error.bind(console, err.message));
};

const getDeadUsers = checkPeriod => {
  return new Promise((resolve, reject) => {
    User.find({ checkPeriod, isAlive: false })
      .then(users => resolve(users))
      .catch(err => reject(err));
  });
};

const getDeadUsersEmails = deadUsers => {
  const ids = deadUsers.map(user => user._id);
  return new Promise((resolve, reject) => {
    Email.find({ _id: { $in: ids } })
      .then(emails => resolve(emails))
      .catch(err => reject(err));
  });
};

const sendEmails = deadUsersEmails => {
  const emailPromises = [];
  deadUsersEmails.forEach(email => {
    const recipents = email.recipents.reduce((accumulator, currentValue) => accumulator + ', ' + currentValue);
    let mailOptions = {
      from: email.senderEmail,
      to: recipents,
      subject: email.subject,
      text: email.text,
    };
    emailPromises.push(
      new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            reject(error);
          } else {
            resolve(info);
          }
        });
      }),
    );
  });

  return Promise.all(emailPromises);
};

const changeUserState = checkPeriod => {
  return new Promise((resolve, reject) => {
    User.update({ checkPeriod, isAlive: true }, { $set: { isAlive: false } })
      .then(() => resolve())
      .catch(err => reject(err));
  });
};

const cleanDB = (deadUsers, deadUsersEmails) => {
  const deadUsersIDs = deadUsers.map(user => user._id);
  const deadUsersEmailsIDs = deadUsersEmails.map(email => email._id);
  return new Promise((resolve, reject) => {
    Email.remove({ _id: { $in: deadUsersEmailsIDs } })
      .then(() => {
        User.remove({ _id: { $in: deadUsersIDs } })
          .then(() => resolve())
          .catch(err => reject(err));
      })
      .catch(err => reject(err));
  });
};

const checkReminders = () => {
  Email.find({ isReminder: true })
    .then(emails => {
      const validEmails = validateRemindersDate(emails);
      sendEmails(validEmails)
        .then(() => cleanDB([], validEmails))
        .catch(err => console.error.bind(console, err.message));
    })
    .catch(err => console.error.bind(console, err.message));
};

const validateRemindersDate = emails => {
  const result = [];
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  emails.forEach(email => {
    const remindingDate = email.remindingDate;
    remindingDate.setHours(0, 0, 0, 0);
    if (remindingDate <= date) {
      result.push(email);
    }
  });
  return result;
};

// Schedule Task For Every Month (28th)
cron.schedule('59 23 28 * *', function() {
  checkJob(Constants.monthly);
});

// Schedule Task For Every Week (Friday)
cron.schedule('59 23 * * Friday', function() {
  checkJob(Constants.weekly);
});

// Schedule Task For Every Day
cron.schedule('59 23 * * *', function() {
  checkJob(Constants.daily);
  checkReminders();
});

module.exports = app;
