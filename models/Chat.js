const mongoose = require("mongoose");

const addressRegex = /^0x[a-fA-F0-9]{40}$/;

const ChatSchema = new mongoose.Schema(
  {
    trxId: {
      type: String,
      required: true,
    },
    user: {
      type: String,
      required: true,
      unique: true,
      match: [
        addressRegex,
        "Address must start with 0x and be followed by 40 hexadecimal characters.",
      ],
    },
    payer: {
      type: String,
      required: true,
      unique: true,
      match: [
        addressRegex,
        "Address must start with 0x and be followed by 40 hexadecimal characters.",
      ],
    },
    messageUser: {
      type: [String],
      default: [],
    },
    messageUserTime: {
      type: [Number],
      default: [],
    },
    messagePayer: {
      type: [String],
      default: [],
    },
    messagePayerTime: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", ChatSchema);
