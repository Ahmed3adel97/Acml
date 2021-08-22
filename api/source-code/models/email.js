const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const EmailSchema = new mongoose.Schema({
  userID: {
    type: ObjectId,
    required: true,
  },
  senderEmail: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  recipents: {
    type: [String],
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  isReminder: {
    type: Boolean,
    default: false,
  },
  remindingDate: {
    type: Date,
  },
});

const Email = mongoose.model('Email', EmailSchema);
module.exports = Email;
