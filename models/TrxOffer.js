const mongoose = require("mongoose");

const addressRegex = /^0x[a-fA-F0-9]{40}$/;

let TrxOfferSchema = new mongoose.Schema(
  {
    trxId: {
      type: String,
      required: true,
    },
    buyerAddrss: {
      type: String,
      required: true,
    },
    usd: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);
TrxOfferSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

module.exports = mongoose.model("TrxOffer", TrxOfferSchema);
