import mongoose from "mongoose";
const addressRegex = /^0x[a-fA-F0-9]{40}$/;

const ChatSchema = new mongoose.Schema(
  {
    trxId: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    user: {
      type: String,
      required: true,
      match: [
        addressRegex,
        "Address must start with 0x and be followed by 40 hexadecimal characters.",
      ],
    },
    payer: {
      type: String,
      required: true,
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
    messageUserType: {
      type: [String],
      enum: ["qr", "message", "image"],
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
    messagePayerType: {
      type: [String],
      enum: ["qr", "text", "image"],
      default: [],
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Chat", ChatSchema);
