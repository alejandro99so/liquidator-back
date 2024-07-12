import express, { Request, Response } from "express";
import PusherServer from "pusher";
import Chat from "../../models/Chat";
import Trx from "../../models/Trx";
import User from "../../models/User";
import { IPayload } from "../../types";
import TrxReq from "../../models/TrxReq";

const apiChat = () => {
  const router = express.Router();

  router.get(
    "/messages",
    async (
      req: Request & {
        payload?: IPayload;
      },
      res: Response
    ) => {
      let chat;
      try {
        chat = await Chat.findOne({
          $or: [
            { user: req.payload?.address },
            { payer: req.payload?.address },
          ],
          active: true,
        });
      } catch (ex: any) {
        console.log(ex.message);
        res.status(400).json({ message: "CHAT_NOT_FOUND" });
        return;
      }
      res.status(200).json({ chat });
    }
  );

  router.post(
    "/create-message",
    async (
      req: Request & {
        payload?: IPayload;
      },
      res: Response
    ) => {
      const Steps = {
        Users: "users",
        UserLiquidator: "userLiquidator",
        EventLiquidator: "eventLiquidator",
      };
      const pusher = new PusherServer({
        appId: String(process.env.PUSHER_APP_ID),
        key: String(process.env.PUSHER_API_KEY),
        secret: String(process.env.PUSHER_SECRET),
        cluster: String(process.env.PUSHER_CLUSTER),
      });
      const body = req.body;
      let trx;
      try {
        trx = await Trx.findOne({
          _id: body.step == Steps.EventLiquidator ? body.trxIdNew : body.trxId,
        });
      } catch (ex: any) {
        console.log(ex.message);
        res.status(400).json({ message: "ERROR_GETTING_MESSAGES" });
        return;
      }
      if (!trx) {
        res.status(400).json({ message: "TRANSACTION_NOT_FOUND" });
        return;
      }
      let channel;
      let message;
      console.log({ body });
      if (body.step == Steps.EventLiquidator) {
        if (body.role != "USER") {
          const user = await User.findOne({ address: req.payload?.address });
          console.log({ user });
          if (!user) {
            res.status(400).json({ message: "USER_NOT_FOUND" });
            return;
          } else if (user.role != "LIQUIDATOR" && user.role != "ADMIN") {
            res.status(400).json({ message: "USER_WITHOUT_PERMISSIONS" });
            return;
          }
        }
        channel = `${trx.code}_liquidator`;
        message = {
          alert: body.message,
          from: req.payload?.address,
          trxId: body.trxIdNew,
        };
      } else {
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
        } else if (
          trx.payerAddress == body.from &&
          trx.userAddress == body.to
        ) {
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
        if (!chat) {
          res.status(400).json({ message: "CHAT_NOT_FOUND" });
          return;
        }
        if (type == "user") {
          chat.messageUser.push(body.message);
          chat.messageUserTime.push(timeUse);
          chat.messageUserType.push(body.type);
        } else {
          chat.messagePayer.push(body.message);
          chat.messagePayerTime.push(timeUse);
          chat.messagePayerType.push(body.type);
        }
        if (body.step == Steps.Users) {
          channel = `${trx.code}_users`;
        } else if (body.step == Steps.UserLiquidator) {
          channel = `${trx.code}_liquidator`;
        } else {
          res.status(400).json({ message: "STEP_NOT_IDENTIFIED" });
          return;
        }
        message = chat;
      }
      pusher.trigger(channel, body.trxId, message);
      res.status(200).json({ status: "sent", message });
    }
  );

  router.patch(
    "",
    async (
      req: Request & {
        payload?: IPayload;
      },
      res: Response
    ) => {
      let _chat;
      try {
        _chat = await Chat.findOneAndUpdate(
          {
            active: true,
            $or: [
              { user: req.payload?.address },
              { payer: req.payload?.address },
            ],
          },
          { active: false }
        );
      } catch (ex: any) {
        console.log(ex.message);
        res.status(400).json({ message: "CHAT_NOT_FOUND" });
        return;
      }
      res.status(200).json(_chat);
    }
  );

  return router;
};

export default apiChat;
