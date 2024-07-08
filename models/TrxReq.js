const mongoose = require("mongoose");

const addressRegex = /^0x[a-fA-F0-9]{40}$/;

let TrxReqSchema = new mongoose.Schema(
  {
    userAddress: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    code: {
      type: String,
      required: true,
    },
    network: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    contract: {
      type: String,
      required: true,
      match: [
        addressRegex,
        "Address must start with 0x and be followed by 40 hexadecimal characters.",
      ],
    },
    cryptoCurrency: {
      type: String,
      required: true,
    },
    usd: {
      type: Number,
      required: true,
    },
    cop: {
      type: Number,
      required: true,
    },
    typeAccount: {
      type: String,
      required: true,
      enum: ["qr", "transfer"],
      default: "qr",
    },
    qr: {
      type: String,
    },
    bankName: {
      type: String,
    },
    bankType: {
      type: String,
    },
    bankNumber: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    friends: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);
// TrxReqSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

module.exports = mongoose.model("TrxReq", TrxReqSchema);
