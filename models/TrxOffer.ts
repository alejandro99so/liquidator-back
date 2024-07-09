import mongoose from "mongoose";

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

export default mongoose.model("TrxOffer", TrxOfferSchema);
