import TrxReq from "../../models/TrxReq";
import TrxOffer from "../../models/TrxOffer";
import Trx from "../../models/Trx";
import Chat from "../../models/Chat";
import getCode from "../../utils/random";
import express, { Request, Response } from "express";
import { IPayload } from "../../types";

type ITrx = {
  userAddress: string;
  network: number;
  contract: string;
  usd: number;
  cop: number;
  typeAccount: "qr" | "transfer";
  message: string;
  code: string;
  cryptoCurrency: string;
  qr?: string;
  bankType?: string;
  bankNumber?: string;
  bankName?: string;
  friends?: string[];
  payerAddress?: string;
};

type IMessage = {
  trxId: string;
  user: string;
  payer: string;
  messageUser: string[];
  messageUserTime: number[];
  messageUserType: ("qr" | "message" | "image")[];
};

type INetwork =
  | "Base"
  | "Avalanche"
  | "Ethereum"
  | "Arbitrum"
  | "Polygon"
  | "Optimism";

const room = () => {
  const router = express.Router();
  const networks = {
    Base: 0,
    Avalanche: 1,
    Ethereum: 2,
    Arbitrum: 3,
    Polygon: 4,
    Optimism: 5,
  };
  const contractsList = {
    usdc1: "0x5425890298aed601595a70AB815c96711a31Bc65",
  };

  const codeToUse = async () => {
    let code = getCode(4);
    const validation = await TrxReq.findOne({ code });
    if (validation) {
      code = await codeToUse();
    }
    return code;
  };

  // request room
  router.post(
    "/request",
    async (
      req: Request & {
        payload?: IPayload;
      },
      res: Response
    ) => {
      const body = req.body;
      const network = networks[body.network as INetwork];

      const contract =
        contractsList[`${body.contract.toLowerCase()}${network}` as "usdc1"];
      const code = await codeToUse();
      let trx: ITrx = {
        userAddress: String(req.payload?.address),
        network,
        contract,
        usd: body.usd,
        cop: body.cop,
        typeAccount: body.type,
        message: body.message,
        code,
        cryptoCurrency: body.contract.toLowerCase(),
      };
      if (body.type.toLowerCase() == "qr") {
        trx.qr = body.qr;
      } else {
        trx.bankType = body.bankType;
        trx.bankNumber = body.bankNumber;
        trx.bankName = body.bankName;
      }
      let trxTemp;
      try {
        trxTemp = await TrxReq.create(trx);
        console.log({ trxTemp });
      } catch (ex: any) {
        console.log(ex.message);
        res.status(400).send({ message: "ERROR_CREATING_TRANSACTION_TEMP" });
        return;
      }
      res.status(201).send({
        message: "REQUEST_ROOM_CREATED",
        id: trxTemp._id,
        code: trxTemp.code,
      });
    }
  );

  // Get request room
  router.get("/request", async (req: Request, res: Response) => {
    let query;
    if (req.query?.active) {
      query = { isActive: true };
    } else if (req.query?.code) {
      query = { code: req.query?.code };
    } else {
      res.status(400).send({ error: "QUERY_NOT_FOUND" });
      return;
    }
    let requests;
    try {
      requests = await TrxReq.find(query, {
        network: true,
        cryptoCurrency: true,
        usd: true,
        cop: true,
      });
    } catch (ex) {
      console.log(ex);
      res.status(400).send({ error: "ERROR_GETTING_TRX" });
      return;
    }
    res.status(200).send(requests);
  });

  // Get Request room by id
  router.get("/request/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    let request;
    try {
      request = await TrxReq.findOne({ _id: id });
      if (!request) {
        res.status(400).send({ error: "TRANSACTION_NOT_FOUND_BY_ID" });
        return;
      }
    } catch (ex) {
      console.log(ex);
      res.status(400).send({ error: "ERROR_GETTING_TRXREQ" });
      return;
    }
    res.status(200).send(request);
  });
  // confirm request room
  router.post(
    "/request-confirm",
    async (
      req: Request & {
        payload?: IPayload;
      },
      res: Response
    ) => {
      const id = req.body.id;
      try {
        await TrxReq.updateOne(
          { _id: id, userAddress: req.payload?.address },
          { isActive: true }
        );
      } catch (ex) {
        console.log(ex);
        res.status(400).send({ message: "ERROR_CONFIRM_REQUEST" });
        return;
      }
      res.status(200).send({ message: "TRANSACTION_CONFIRMED" });
    }
  );

  // Create offer to room
  router.post(
    "/offer",
    async (
      req: Request & {
        payload?: IPayload;
      },
      res: Response
    ) => {
      const body = req.body;
      let offer = {
        trxId: body.trxId,
        buyerAddrss: req.payload?.address,
        usd: body.usd,
      };
      let trxOffer;
      try {
        trxOffer = await TrxOffer.create(offer);
      } catch (ex: any) {
        console.log(ex.message);
        res.status(400).send({ message: "ERROR_CREATING_OFFER_ROOM" });
        return;
      }
      res.status(201).send({ message: "OFFER_ROOM_CREATED", id: trxOffer._id });
    }
  );

  // confirm room
  router.post(
    "/confirm",
    async (
      req: Request & {
        payload?: IPayload;
      },
      res: Response
    ) => {
      const body = req.body;
      let trx: ITrx;
      let requestRoom;
      if (body.offerRoom) {
        try {
          requestRoom = await TrxReq.findOneAndDelete({
            userAddress: req.payload?.address,
          });
          if (!requestRoom) {
            res.status(400).send({ message: "TRANSACTION_NOT_FOUND" });
            return;
          }
          const offer = await TrxOffer.findOneAndDelete({
            _id: body.offerRoom,
          });
          if (!offer) {
            res.status(400).send({ message: "OFFER_NOT_FOUND" });
            return;
          }
          trx = {
            userAddress: requestRoom.userAddress,
            network: requestRoom.network,
            contract: requestRoom.contract,
            cop: requestRoom.cop,
            typeAccount: requestRoom.typeAccount,
            message: String(requestRoom.message),
            code: requestRoom.code,
            cryptoCurrency: requestRoom.cryptoCurrency,
            friends: requestRoom.friends,
            payerAddress: offer.buyerAddrss,
            usd: offer.usd,
          };
        } catch (ex) {
          console.log(ex);
          res.status(400).send({ message: "ERROR_GETTING_TRXS" });
          return;
        }
      } else {
        try {
          requestRoom = await TrxReq.findOneAndDelete({
            _id: body.requestRoom,
          });
          if (!requestRoom) {
            res.status(400).send({ message: "TRANSACTION_NOT_FOUND" });
            return;
          }
          trx = {
            userAddress: requestRoom.userAddress,
            network: requestRoom.network,
            contract: requestRoom.contract,
            cop: requestRoom.cop,
            typeAccount: requestRoom.typeAccount,
            message: requestRoom.message ?? "",
            code: requestRoom.code,
            cryptoCurrency: requestRoom.cryptoCurrency,
            friends: requestRoom.friends,
            payerAddress: String(req.payload?.address),
            usd: requestRoom.usd,
          };
        } catch (ex) {
          console.log(ex);
          res.status(400).send({ message: "ERROR_GETTING_TRXS" });
          return;
        }
      }
      let messages: IMessage = {
        trxId: "",
        user: trx.userAddress,
        payer: String(trx.payerAddress),
        messageUser: [],
        messageUserTime: [],
        messageUserType: [],
      };
      const now = Math.floor(Date.now() / 1000);
      if (requestRoom.typeAccount == "qr") {
        trx.qr = String(requestRoom.qr);
        messages.messageUser = [
          String(requestRoom.qr),
          `Mensaje: ${requestRoom.message}`,
        ];
        messages.messageUserTime = [now, now];
        messages.messageUserType = ["qr", "message"];
      } else {
        trx.bankType = String(requestRoom.bankType);
        trx.bankNumber = String(requestRoom.bankNumber);
        trx.bankName = String(requestRoom.bankName);
        messages.messageUser = [
          `Banco: ${requestRoom.bankName}`,
          `Tipo de cuenta: ${requestRoom.bankType}`,
          `Número de cuenta: ${requestRoom.bankNumber}`,
          `Mensaje: ${requestRoom.message}`,
        ];
        messages.messageUserTime = [now, now, now, now];
        messages.messageUserType = ["message", "message", "message", "message"];
      }
      let newTrx;
      try {
        newTrx = await Trx.create(trx);
        console.log(newTrx);
      } catch (ex: any) {
        console.log(ex.message);
        res.status(400).send({ message: "ERROR_CREATING_TRX" });
        return;
      }
      messages.trxId = String(newTrx._id);
      // Send Messages
      try {
        await Chat.create(messages);
      } catch (ex: any) {
        console.log(ex.message);
        res.status(400).json({ message: "ERROR_SAVING_MESSAGE" });
        return;
      }
      res.status(200).send({ message: "OFFER_ACEPTED", id: newTrx._id });
    }
  );

  // validate room activate
  router.get(
    "/validate",
    async (
      req: Request & {
        payload?: IPayload;
      },
      res: Response
    ) => {
      let trx;
      try {
        trx = await Trx.find({
          $or: [
            { userAddress: req.payload?.address },
            { payerAddress: req.payload?.address },
            { friends: req.payload?.address },
          ],
        });
      } catch (ex: any) {
        console.log(ex.message);
        res.status(400).send({ message: "ERROR_GETTING_TRXS" });
        return;
      }
      res.status(200).send({ trx });
    }
  );

  // Join room activated
  router.post(
    "/join",
    async (
      req: Request & {
        payload?: IPayload;
      },
      res: Response
    ) => {
      const code = req.body.code;
      let requests;
      try {
        requests = await TrxReq.findOneAndUpdate(
          { code, isActive: false },
          { $push: { friends: req.payload?.address } }
        );
      } catch (ex) {
        console.log(ex);
        res.status(400).send({ error: "ERROR_GETTING_TRX" });
        return;
      }
      res.status(200).send(requests);
    }
  );
  return router;
};

export default room;
