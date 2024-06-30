const mongoose = require("mongoose");

const addressRegex = /^0x[a-fA-F0-9]{40}$/;

let TrxSchema = new mongoose.Schema(
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
    payerAddress: {
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
    bankType: {
      type: String,
    },
    bankNumber: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "INPROGRESS",
        "INCOMPLETE",
        "STARTED",
        "PAYED",
        "REJECTED",
        "FINISHED",
      ],
      default: "INPROGRESS",
    },
    payedAt: {
      type: Date,
    },
    friends: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trx", TrxSchema);
// INPROGRESS: crypto has to be sent to sc
// INCOMPLETE: crypto never was sent
// STARTED: Payment in fiat has to be done
// PAYED: Bill payed
// REJECTED: Payment in fiat was not done
// FINISHED: Crypto was given to payer
