const express = require("express");
const PusherServer = require("pusher");
const Chat = require("../../models/Chat");
const Trx = require("../../models/Trx");

module.exports = () => {
  const router = express.Router();

  router.get("/messages", async (req, res, next) => {
    let chat;
    try {
      chat = await Chat.findOne({ trxId: req.query.trxId });
    } catch (ex) {
      console.log(ex.message);
      res.status(400).json({ message: "CHAT_NOT_FOUND" });
      return;
    }
    res.status(200).json({ chat });
  });

  router.post("/create-message", async (req, res) => {
    const Steps = {
      Users: "users",
      UserLiquidator: "userLiquidator",
    };
    const pusher = new PusherServer({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_API_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
    });
    const body = req.body;
    let trx;
    try {
      trx = await Trx.findOne({ _id: body.trxId });
    } catch (ex) {
      console.log(ex.message);
      res.status(400).json({ message: "ERROR_GETTING_MESSAGES" });
      return;
    }
    if (!trx) {
      res.status(400).json({ message: "TRANSACTION_NOT_FOUND" });
      return;
    }
    let update;
    let type = "user";
    const timeUse = Math.floor(Date.now() / 1000);
    if (trx.userAddress == body.from && trx.payerAddress == body.to) {
      update = {
        $push: {
          messageUser: body.message,
          messageUserTime: timeUse,
          messageUserType: body.type,
        },
      };
    } else if (trx.payerAddress == body.from && trx.userAddress == body.to) {
      type = "payer";
      update = {
        $push: {
          messagePayer: body.message,
          messagePayerTime: timeUse,
          messagePayerType: body.type,
        },
      };
    } else {
      res.status(400).json({ message: "USER_TRANSACTION_NOT_FOUND" });
      return;
    }
    let chat = await Chat.findOneAndUpdate({ trxId: body.trxId }, update);
    if (type == "user") {
      chat.messageUser.push(body.message);
      chat.messageUserTime.push(timeUse);
      chat.messageUserType.push(body.type);
    } else {
      chat.messagePayer.push(body.message);
      chat.messagePayerTime.push(timeUse);
      chat.messagePayerType.push(body.type);
    }
    let channel;
    if (body.step == Steps.Users) {
      channel = `${trx.code}_users`;
    } else if (body.step == Steps.Users) {
      channel = `${trx.code}_liquidator`;
    } else {
      res.status(400).json({ message: "STEP_NOT_IDENTIFIED" });
      return;
    }
    pusher.trigger(channel, body.trxId, { chat });
    res.status(200).json({ status: "sent", chat });
  });

  return router;
};
