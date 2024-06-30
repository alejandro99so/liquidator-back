const express = require("express");
const PusherServer = require("pusher");
const Chat = require("../../models/Chat");
const Trx = require("../../models/Trx");

module.exports = () => {
  const router = express.Router();

  router.post("/create-message", async (req, res, next) => {
    const pusher = new PusherServer({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_API_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
    });
    const body = req.body;
    // try {
    //   await Chat.create({
    //     trxId: body.trxId,
    //     user: body.from,
    //     payer: body.address,
    //     messageUser: ["Hola!"],
    //     messageUserTime: [Math.floor(Date.now() / 1000)],
    //   });
    // } catch (ex) {
    //   console.log(ex.message);
    //   res.json({ message: "ERROR_SAVING_MESSAGE" });
    //   return;
    // }
    let trx;
    try {
      trx = await Trx.findOne({ _id: body.trxId });
    } catch (ex) {
      console.log(ex.message);
      res.json({ message: "ERROR_GETTING_MESSAGES" });
      return;
    }
    if (!trx) {
      res.json({ message: "TRANSACTION_NOT_FOUND" });
      return;
    }
    console.log(trx);
    let update;
    let type = "user";
    const timeUse = Math.floor(Date.now() / 1000);
    if (trx.userAddress == body.from && trx.payerAddress == body.to) {
      update = {
        $push: {
          messageUser: body.message,
          messageUserTime: timeUse,
        },
      };
    } else if (trx.payerAddress == body.from && trx.userAddress == body.to) {
      type = "payer";
      update = {
        $push: {
          messagePayer: body.message,
          messagePayerTime: timeUse,
        },
      };
    } else {
      res.json({ message: "USER_TRANSACTION_NOT_FOUND" });
      return;
    }
    let _chat = await Chat.findOneAndUpdate({ trxId: body.trxId }, update);
    console.log({ _chat });
    if (type == "user") {
      _chat.messageUser.push(body.message);
      _chat.messageUserTime.push(timeUse);
    } else {
      _chat.messagePayer.push(body.message);
      _chat.messagePayerTime.push(timeUse);
    }
    pusher.trigger("room-2", body.trxId, {
      chat: _chat,
    });
    res.json({ status: "sent", chat: _chat });
  });

  return router;
};
